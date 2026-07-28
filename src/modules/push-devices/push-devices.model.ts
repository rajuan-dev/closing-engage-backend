import { Document, Schema, Types, model } from 'mongoose';

import { notificationRecipientRoles, type NotificationRecipientRole } from '../notifications/notifications.model';

export const pushDevicePlatforms = ['android', 'ios'] as const;
export type PushDevicePlatform = (typeof pushDevicePlatforms)[number];

export interface IPushDevice extends Document {
  userId: Types.ObjectId;
  userRole: NotificationRecipientRole;
  expoPushToken: string;
  platform: PushDevicePlatform;
  deviceName?: string;
  deviceModel?: string;
  appVersion?: string;
  isActive: boolean;
  lastRegisteredAt: Date;
  lastDeliveredAt?: Date;
  unregisteredAt?: Date;
  disabledReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pushDeviceSchema = new Schema<IPushDevice>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    userRole: { type: String, enum: notificationRecipientRoles, required: true, index: true },
    expoPushToken: { type: String, required: true, unique: true, trim: true, index: true },
    platform: { type: String, enum: pushDevicePlatforms, required: true },
    deviceName: { type: String, trim: true },
    deviceModel: { type: String, trim: true },
    appVersion: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    lastRegisteredAt: { type: Date, default: Date.now, index: true },
    lastDeliveredAt: { type: Date },
    unregisteredAt: { type: Date },
    disabledReason: { type: String, trim: true },
  },
  { timestamps: true },
);

pushDeviceSchema.index({ userId: 1, userRole: 1, isActive: 1, updatedAt: -1 });

export const PushDevice = model<IPushDevice>('PushDevice', pushDeviceSchema);
