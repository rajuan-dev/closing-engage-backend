import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../core/http-error';
import { createNotificationSafely, notifyAdminsSafely } from '../notifications/notifications.service';
import { Order } from '../orders/orders.model';
import { AdminUser } from '../auth/auth.model';
import { NotaryUser } from '../user/notary-user.model';
import {
  CommunicationMessage,
  CommunicationRole,
  CommunicationThread,
  ICommunicationMessage,
  ICommunicationThread,
} from './communications.model';

export type CommunicationAuth = {
  id: string;
  email: string;
  role: 'admin' | 'company' | 'notary';
};

type SendMessageInput = {
  orderNumber: string;
  body: string;
};

const orderLookupQuery = (value: string) => {
  const normalized = value.trim();
  const withHash = normalized.startsWith('#') ? normalized : `#${normalized}`;
  const withoutHash = normalized.replace(/^#/, '');

  if (Types.ObjectId.isValid(normalized)) {
    return { _id: normalized };
  }

  return { orderNumber: { $in: [normalized, withHash, withoutHash] } };
};

const readableTime = (date: Date): string =>
  date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const senderNameFor = async (auth: CommunicationAuth): Promise<string> => {
  if (auth.role === 'admin') {
    const admin = await AdminUser.findById(auth.id).select('fullName email');
    return admin?.fullName || 'Closing Engage Admin';
  }

  const notary = await NotaryUser.findById(auth.id).select('fullName email');
  return notary?.fullName || auth.email;
};

const getAdminProfile = async () => {
  const admin = await AdminUser.findOne({ isActive: true }).select('fullName avatarUrl').sort({ updatedAt: -1, createdAt: -1 });
  return {
    name: admin?.fullName || 'Closing Engage Admin',
    avatarUrl: admin?.avatarUrl || '',
  };
};

const serializeMessage = (message: ICommunicationMessage) => ({
  id: message._id.toString(),
  threadId: message.threadId.toString(),
  orderNumber: message.orderNumber,
  senderId: message.senderId.toString(),
  senderRole: message.senderRole,
  senderName: message.senderName,
  body: message.body,
  createdAt: message.createdAt.toISOString(),
  time: readableTime(message.createdAt),
  readByAdmin: message.readByAdmin,
  readByNotary: message.readByNotary,
});

const serializeThread = (thread: ICommunicationThread, unreadCount = 0) => ({
  id: thread._id.toString(),
  orderNumber: thread.orderNumber,
  companyId: thread.companyId?.toString() ?? '',
  notaryId: thread.notaryId?.toString() ?? '',
  lastMessage: thread.lastMessage ?? '',
  lastMessageAt: thread.lastMessageAt?.toISOString() ?? thread.updatedAt.toISOString(),
  lastSenderRole: thread.lastSenderRole ?? '',
  unreadCount,
});

function assertCommunicationRole(auth: CommunicationAuth): asserts auth is CommunicationAuth & { role: CommunicationRole } {
  if (auth.role !== 'admin' && auth.role !== 'notary') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins and assigned notaries can use order chat');
  }
}

const getScopedOrder = async (auth: CommunicationAuth, orderNumber: string) => {
  assertCommunicationRole(auth);

  const order = await Order.findOne(orderLookupQuery(orderNumber));

  if (!order) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  if (auth.role === 'notary' && order.assignedNotaryId?.toString() !== auth.id) {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Order chat is outside notary assignment scope');
  }

  return order;
};

export const getOrCreateThreadForOrder = async (auth: CommunicationAuth, orderNumber: string) => {
  const order = await getScopedOrder(auth, orderNumber);

  const thread = await CommunicationThread.findOneAndUpdate(
    { orderNumber: order.orderNumber },
    {
      $set: {
        companyId: order.companyId,
        notaryId: order.assignedNotaryId,
      },
    },
    { returnDocument: 'after', upsert: true },
  );

  return serializeThread(thread);
};

export const listThreads = async (auth: CommunicationAuth) => {
  assertCommunicationRole(auth);

  const query = auth.role === 'admin' ? {} : { notaryId: new Types.ObjectId(auth.id) };
  const threads = await CommunicationThread.find(query).sort({ lastMessageAt: -1, updatedAt: -1 });
  const threadIds = threads.map((thread) => thread._id);

  const unreadMatch =
    auth.role === 'admin'
      ? { threadId: { $in: threadIds }, senderRole: 'notary', readByAdmin: false }
      : { threadId: { $in: threadIds }, senderRole: 'admin', readByNotary: false };

  const unread = threadIds.length
    ? await CommunicationMessage.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: unreadMatch },
        { $group: { _id: '$threadId', count: { $sum: 1 } } },
      ])
    : [];
  const unreadByThread = new Map(unread.map((item) => [item._id.toString(), item.count]));

  return threads.map((thread) => serializeThread(thread, unreadByThread.get(thread._id.toString()) ?? 0));
};

export const getThreadMessages = async (auth: CommunicationAuth, orderNumber: string) => {
  const thread = await getOrCreateThreadForOrder(auth, orderNumber);
  const adminProfile = await getAdminProfile();

  await CommunicationMessage.updateMany(
    { threadId: thread.id },
    auth.role === 'admin' ? { readByAdmin: true } : { readByNotary: true },
  );

  const messages = await CommunicationMessage.find({ threadId: thread.id }).sort({ createdAt: 1 });
  return {
    thread: {
      ...thread,
      adminName: adminProfile.name,
      adminAvatarUrl: adminProfile.avatarUrl,
    },
    messages: messages.map(serializeMessage),
  };
};

export const sendMessage = async (auth: CommunicationAuth, input: SendMessageInput) => {
  assertCommunicationRole(auth);

  const body = input.body.trim();
  if (!body) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Message body is required');
  }

  const thread = await getOrCreateThreadForOrder(auth, input.orderNumber);
  const senderName = await senderNameFor(auth);
  const message = await new CommunicationMessage({
    threadId: new Types.ObjectId(thread.id),
    orderNumber: thread.orderNumber,
    senderId: new Types.ObjectId(auth.id),
    senderRole: auth.role,
    senderName,
    body,
    readByAdmin: auth.role === 'admin',
    readByNotary: auth.role === 'notary',
  }).save();

  await CommunicationThread.findByIdAndUpdate(thread.id, {
    lastMessage: body,
    lastMessageAt: message.createdAt,
    lastSenderRole: auth.role,
  });

  if (auth.role === 'notary') {
    void notifyAdminsSafely({
      title: 'New notary message',
      message: `${senderName} sent a message on ${thread.orderNumber}.`,
      type: 'order',
      linkId: thread.orderNumber,
    });
  } else if (thread.notaryId) {
    void createNotificationSafely({
      recipientId: thread.notaryId,
      recipientRole: 'notary',
      title: 'New admin message',
      message: `Admin sent a message on ${thread.orderNumber}.`,
      type: 'order',
      linkId: thread.orderNumber,
    });
  }

  return {
    thread: {
      ...thread,
      lastMessage: body,
      lastMessageAt: message.createdAt.toISOString(),
      lastSenderRole: auth.role,
    },
    message: serializeMessage(message),
  };
};
