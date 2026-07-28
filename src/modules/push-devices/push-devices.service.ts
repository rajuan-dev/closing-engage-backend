import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { notificationRecipientRoles, type NotificationRecipientRole } from '../notifications/notifications.model';
import { PushDevice, type IPushDevice, type PushDevicePlatform } from './push-devices.model';

type AuthContext = {
  id: string;
  email: string;
  role: NotificationRecipientRole;
};

type RegisterPushDeviceInput = {
  expoPushToken: string;
  platform: PushDevicePlatform;
  deviceName?: string;
  deviceModel?: string;
  appVersion?: string;
};

const expoPushTokenPattern = /^(Expo|Exponent)PushToken\[[A-Za-z0-9-]+\]$/;

const sanitizeOptional = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const isValidExpoPushToken = (value: string): boolean => expoPushTokenPattern.test(value.trim());

function assertRoleSupported(role: string): asserts role is NotificationRecipientRole {
  if (!(notificationRecipientRoles as readonly string[]).includes(role)) {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Push notifications are not available for this role');
  }
}

const serializePushDevice = (device: IPushDevice) => ({
  id: device._id.toString(),
  expoPushToken: device.expoPushToken,
  platform: device.platform,
  deviceName: device.deviceName ?? '',
  deviceModel: device.deviceModel ?? '',
  appVersion: device.appVersion ?? '',
  isActive: device.isActive,
  lastRegisteredAt: device.lastRegisteredAt.toISOString(),
});

export const registerPushDevice = async (auth: AuthContext, input: RegisterPushDeviceInput) => {
  assertRoleSupported(auth.role);

  const expoPushToken = input.expoPushToken.trim();
  if (!isValidExpoPushToken(expoPushToken)) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'A valid Expo push token is required');
  }

  const device = await PushDevice.findOneAndUpdate(
    { expoPushToken },
    {
      userId: new Types.ObjectId(auth.id),
      userRole: auth.role,
      expoPushToken,
      platform: input.platform,
      deviceName: sanitizeOptional(input.deviceName),
      deviceModel: sanitizeOptional(input.deviceModel),
      appVersion: sanitizeOptional(input.appVersion),
      isActive: true,
      lastRegisteredAt: new Date(),
      unregisteredAt: undefined,
      disabledReason: undefined,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  return serializePushDevice(device);
};

export const unregisterPushDevice = async (auth: AuthContext, expoPushToken: string) => {
  assertRoleSupported(auth.role);

  const normalizedToken = expoPushToken.trim();
  if (!normalizedToken) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Expo push token is required');
  }

  await PushDevice.updateMany(
    {
      expoPushToken: normalizedToken,
      userId: new Types.ObjectId(auth.id),
      userRole: auth.role,
      isActive: true,
    },
    {
      isActive: false,
      unregisteredAt: new Date(),
      disabledReason: 'unregistered',
    },
  );
};

export const getActivePushDevices = async (recipientRole: NotificationRecipientRole, recipientId: string) =>
  PushDevice.find({
    userRole: recipientRole,
    userId: new Types.ObjectId(recipientId),
    isActive: true,
  }).sort({ updatedAt: -1 });

export const markPushTokensInvalid = async (expoPushTokens: string[], reason: string) => {
  if (!expoPushTokens.length) {
    return;
  }

  await PushDevice.updateMany(
    { expoPushToken: { $in: expoPushTokens } },
    {
      isActive: false,
      disabledReason: reason,
      unregisteredAt: new Date(),
    },
  );
};

export const markPushTokensDelivered = async (expoPushTokens: string[]) => {
  if (!expoPushTokens.length) {
    return;
  }

  await PushDevice.updateMany(
    { expoPushToken: { $in: expoPushTokens } },
    {
      lastDeliveredAt: new Date(),
    },
  );
};

export const logPushSendFailure = (context: Record<string, unknown>, error: unknown) => {
  logger.error({ err: error, ...context }, 'Expo push notification delivery failed');
};
