import { NotificationRecipientRole, type NotificationType } from '../notifications/notifications.model';
import { AdminUser } from '../auth/auth.model';
import { CompanyUser } from '../user/company-user.model';
import { NotaryUser } from '../user/notary-user.model';
import {
  getActivePushDevices,
  logPushSendFailure,
  markPushTokensDelivered,
  markPushTokensInvalid,
} from './push-devices.service';

type PushNotificationPayload = {
  recipientId: string;
  recipientRole: NotificationRecipientRole;
  title: string;
  message: string;
  type: NotificationType;
  linkId?: string;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  priority: 'high';
  channelId: 'default';
  data: {
    notificationType: NotificationType;
    role: NotificationRecipientRole;
    linkId?: string;
  };
};

type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushResponse = {
  data?: ExpoPushTicket[];
  errors?: Array<{ message?: string; code?: string }>;
};

const expoPushApiUrl = 'https://exp.host/--/api/v2/push/send';

const chunk = <T>(items: T[], size: number) => {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
};

const loadNotificationPreference = async (recipientRole: NotificationRecipientRole, recipientId: string, type: NotificationType) => {
  if (type === 'system' || type === 'user') {
    return true;
  }

  if (recipientRole === 'company') {
    const company = await CompanyUser.findById(recipientId).select('notifications');
    return type === 'order' ? company?.notifications?.orders !== false : company?.notifications?.documents === true;
  }

  if (recipientRole === 'notary') {
    const notary = await NotaryUser.findById(recipientId).select('notifications');
    return type === 'order' ? notary?.notifications?.orders !== false : notary?.notifications?.documents === true;
  }

  const admin = await AdminUser.findById(recipientId).select('notifications');
  return type === 'order' ? admin?.notifications?.orders !== false : admin?.notifications?.documents === true;
};

const buildExpoMessage = (token: string, payload: PushNotificationPayload): ExpoPushMessage => ({
  to: token,
  title: payload.title,
  body: payload.message,
  sound: 'default',
  priority: 'high',
  channelId: 'default',
  data: {
    notificationType: payload.type,
    role: payload.recipientRole,
    linkId: payload.linkId,
  },
});

const sendChunk = async (messages: ExpoPushMessage[]) => {
  const response = await fetch(expoPushApiUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const payload = (await response.json().catch(() => null)) as ExpoPushResponse | null;
  if (!response.ok) {
    throw new Error(payload?.errors?.[0]?.message || `Expo push API responded with ${response.status}`);
  }

  return payload?.data ?? [];
};

export const sendPushNotificationForNotification = async (payload: PushNotificationPayload) => {
  const canDeliver = await loadNotificationPreference(payload.recipientRole, payload.recipientId, payload.type);
  if (!canDeliver) {
    return;
  }

  const devices = await getActivePushDevices(payload.recipientRole, payload.recipientId);
  if (!devices.length) {
    return;
  }

  const messages = devices.map((device) => buildExpoMessage(device.expoPushToken, payload));
  const invalidTokens: string[] = [];
  const deliveredTokens: string[] = [];

  for (const batch of chunk(messages, 100)) {
    try {
      const tickets = await sendChunk(batch);
      tickets.forEach((ticket, index) => {
        const token = batch[index]?.to;
        if (!token) {
          return;
        }

        if (ticket.status === 'ok') {
          deliveredTokens.push(token);
          return;
        }

        const errorCode = ticket.details?.error ?? ticket.message ?? 'unknown';
        if (errorCode === 'DeviceNotRegistered') {
          invalidTokens.push(token);
          return;
        }

        logPushSendFailure(
          {
            recipientId: payload.recipientId,
            recipientRole: payload.recipientRole,
            expoPushToken: token,
            errorCode,
          },
          new Error(ticket.message || errorCode),
        );
      });
    } catch (error) {
      logPushSendFailure(
        {
          recipientId: payload.recipientId,
          recipientRole: payload.recipientRole,
          batchSize: batch.length,
        },
        error,
      );
    }
  }

  await Promise.all([markPushTokensDelivered(deliveredTokens), markPushTokensInvalid(invalidTokens, 'DeviceNotRegistered')]);
};
