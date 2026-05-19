import { Document, Schema, Types, model } from 'mongoose';

export const notificationRecipientRoles = ['admin', 'company', 'notary'] as const;
export const notificationTypes = ['order', 'document', 'user', 'system'] as const;

export type NotificationRecipientRole = (typeof notificationRecipientRoles)[number];
export type NotificationType = (typeof notificationTypes)[number];

export interface INotification extends Document {
  recipientId: Types.ObjectId;
  recipientRole: NotificationRecipientRole;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  linkId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, required: true, index: true },
    recipientRole: { type: String, enum: notificationRecipientRoles, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    type: { type: String, enum: notificationTypes, default: 'system', index: true },
    linkId: { type: String, trim: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, recipientRole: 1, read: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
