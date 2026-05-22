import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import {
  emitNotificationCreated,
  emitNotificationDeleted,
  emitNotificationRead,
  emitNotificationsCleared,
  emitNotificationsReadAll,
} from '../communications/communications.socket';
import { AdminUser } from '../auth/auth.model';
import {
  INotification,
  Notification,
  NotificationRecipientRole,
  NotificationType,
} from './notifications.model';

type AuthContext = { id: string; email: string; role: 'admin' | 'company' | 'notary' };

type CreateNotificationInput = {
  recipientId: string | Types.ObjectId;
  recipientRole: NotificationRecipientRole;
  title: string;
  message: string;
  type: NotificationType;
  linkId?: string;
};

const relativeTime = (date: Date): string => {
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const serializeNotification = (notification: INotification) => ({
  id: notification._id.toString(),
  title: notification.title,
  message: notification.message,
  time: relativeTime(notification.createdAt),
  read: notification.read,
  type: notification.type,
  linkId: notification.linkId ?? '',
  recipientRole: notification.recipientRole,
});

export const createNotification = async (input: CreateNotificationInput) => {
  const notification = await Notification.create({
    ...input,
    recipientId: new Types.ObjectId(input.recipientId),
  });

  emitNotificationCreated(input.recipientRole, String(input.recipientId), serializeNotification(notification));
  return notification;
};

export const createNotificationSafely = async (input: CreateNotificationInput): Promise<void> => {
  try {
    await createNotification(input);
  } catch (error) {
    logger.error({ err: error, input }, 'Notification creation failed');
  }
};

export const notifyAdminsSafely = async (input: Omit<CreateNotificationInput, 'recipientId' | 'recipientRole'>) => {
  try {
    const admins = await AdminUser.find({ isActive: true }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          ...input,
          recipientId: admin._id,
          recipientRole: 'admin',
        }),
      ),
    );
  } catch (error) {
    logger.error({ err: error, input }, 'Admin notification fanout failed');
  }
};

export const listNotifications = async (auth: AuthContext) => {
  const notifications = await Notification.find({
    recipientId: auth.id,
    recipientRole: auth.role,
  }).sort({ createdAt: -1 });

  return notifications.map(serializeNotification);
};

export const markNotificationRead = async (auth: AuthContext, id: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientId: auth.id, recipientRole: auth.role },
    { read: true },
    { new: true },
  );

  if (!notification) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Notification not found');
  }

  emitNotificationRead(auth.role, auth.id, notification._id.toString());
  return serializeNotification(notification);
};

export const markAllNotificationsRead = async (auth: AuthContext) => {
  await Notification.updateMany(
    { recipientId: auth.id, recipientRole: auth.role, read: false },
    { read: true },
  );

  emitNotificationsReadAll(auth.role, auth.id);
};

export const deleteNotification = async (auth: AuthContext, id: string) => {
  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipientId: auth.id,
    recipientRole: auth.role,
  });

  if (!notification) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Notification not found');
  }

  emitNotificationDeleted(auth.role, auth.id, notification._id.toString());
  return serializeNotification(notification);
};

export const clearAllNotifications = async (auth: AuthContext) => {
  await Notification.deleteMany({
    recipientId: auth.id,
    recipientRole: auth.role,
  });

  emitNotificationsCleared(auth.role, auth.id);
};
