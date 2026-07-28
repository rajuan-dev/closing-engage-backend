import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { sendEmail } from '../email/email.service';
import {
  emitNotificationCreated,
  emitNotificationDeleted,
  emitNotificationRead,
  emitNotificationsCleared,
  emitNotificationsReadAll,
} from '../communications/communications.socket';
import { AdminUser } from '../auth/auth.model';
import { CompanyUser } from '../user/company-user.model';
import { NotaryUser } from '../user/notary-user.model';
import { sendPushNotificationForNotification } from '../push-devices/expo-push.service';
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

type NotificationPreferenceState = {
  email: boolean;
  orders: boolean;
  documents: boolean;
};

type RecipientNotificationSettings = {
  emailAddress: string | null;
  preferences: NotificationPreferenceState;
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

const defaultNotificationPreferences: NotificationPreferenceState = {
  email: true,
  orders: true,
  documents: true,
};

const loadRecipientNotificationSettings = async (
  recipientRole: NotificationRecipientRole,
  recipientId: string | Types.ObjectId,
): Promise<RecipientNotificationSettings | null> => {
  const normalizedRecipientId = String(recipientId);

  if (recipientRole === 'company') {
    const company = await CompanyUser.findById(normalizedRecipientId).select('businessEmail notifications').lean();
    if (!company) return null;

    return {
      emailAddress: company.businessEmail ?? null,
      preferences: {
        email: company.notifications?.email ?? defaultNotificationPreferences.email,
        orders: company.notifications?.orders ?? defaultNotificationPreferences.orders,
        documents: company.notifications?.documents ?? defaultNotificationPreferences.documents,
      },
    };
  }

  if (recipientRole === 'notary') {
    const notary = await NotaryUser.findById(normalizedRecipientId).select('email notifications').lean();
    if (!notary) return null;

    return {
      emailAddress: notary.email ?? null,
      preferences: {
        email: notary.notifications?.email ?? defaultNotificationPreferences.email,
        orders: notary.notifications?.orders ?? defaultNotificationPreferences.orders,
        documents: notary.notifications?.documents ?? defaultNotificationPreferences.documents,
      },
    };
  }

  const admin = await AdminUser.findById(normalizedRecipientId).select('email notifications').lean();
  if (!admin) return null;

  return {
    emailAddress: admin.email ?? null,
    preferences: {
      email: admin.notifications?.email ?? defaultNotificationPreferences.email,
      orders: admin.notifications?.orders ?? defaultNotificationPreferences.orders,
      documents: admin.notifications?.documents ?? defaultNotificationPreferences.documents,
    },
  };
};

const canReceiveNotificationType = (
  preferences: NotificationPreferenceState,
  type: NotificationType,
): boolean => {
  if (type === 'order') {
    return preferences.orders;
  }

  if (type === 'document') {
    return preferences.documents;
  }

  return true;
};

const sendNotificationEmailSafely = async (
  input: CreateNotificationInput,
  recipientEmail: string,
): Promise<void> => {
  try {
    await sendEmail({
      to: recipientEmail,
      subject: `${input.title} | Closing Engage`,
      html: `
        <h2>${input.title}</h2>
        <p>${input.message}</p>
        ${input.linkId ? `<p>Reference: ${input.linkId}</p>` : ''}
      `,
      text: [input.title, input.message, input.linkId ? `Reference: ${input.linkId}` : ''].filter(Boolean).join('\n\n'),
    });
  } catch (error) {
    logger.error({ err: error, recipientEmail, input }, 'Notification email delivery failed');
  }
};

export const createNotification = async (input: CreateNotificationInput) => {
  const recipientSettings = await loadRecipientNotificationSettings(input.recipientRole, input.recipientId);
  const preferences = recipientSettings?.preferences ?? defaultNotificationPreferences;

  if (!canReceiveNotificationType(preferences, input.type)) {
    return null;
  }

  const notification = await Notification.create({
    ...input,
    recipientId: new Types.ObjectId(input.recipientId),
  });

  emitNotificationCreated(input.recipientRole, String(input.recipientId), serializeNotification(notification));
  void sendPushNotificationForNotification({
    recipientId: String(input.recipientId),
    recipientRole: input.recipientRole,
    title: input.title,
    message: input.message,
    type: input.type,
    linkId: input.linkId,
  }).catch((error) => {
    logger.error(
      {
        err: error,
        recipientId: String(input.recipientId),
        recipientRole: input.recipientRole,
        type: input.type,
      },
      'Push notification fanout failed',
    );
  });

  if (preferences.email && recipientSettings?.emailAddress) {
    void sendNotificationEmailSafely(input, recipientSettings.emailAddress);
  }

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

export const notifyActiveNotariesSafely = async (
  input: Omit<CreateNotificationInput, 'recipientId' | 'recipientRole'>,
) => {
  try {
    const notaries = await NotaryUser.find({ status: { $ne: 'Inactive' } }).select('_id');
    await Promise.all(
      notaries.map((notary) =>
        createNotification({
          ...input,
          recipientId: notary._id,
          recipientRole: 'notary',
        }),
      ),
    );
  } catch (error) {
    logger.error({ err: error, input }, 'Notary notification fanout failed');
  }
};

export const notifyNotariesByIdsSafely = async (
  recipientIds: Array<string | Types.ObjectId>,
  input: Omit<CreateNotificationInput, 'recipientId' | 'recipientRole'>,
) => {
  try {
    const uniqueRecipientIds = Array.from(new Set(recipientIds.map((recipientId) => String(recipientId))));
    await Promise.all(
      uniqueRecipientIds.map((recipientId) =>
        createNotification({
          ...input,
          recipientId,
          recipientRole: 'notary',
        }),
      ),
    );
  } catch (error) {
    logger.error({ err: error, input, recipientIds }, 'Selected notary notification fanout failed');
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
