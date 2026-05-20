import { Document, Schema, Types, model } from 'mongoose';

export const communicationRoles = ['admin', 'notary'] as const;

export type CommunicationRole = (typeof communicationRoles)[number];

export interface ICommunicationThread extends Document {
  orderNumber: string;
  companyId?: Types.ObjectId;
  notaryId?: Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastSenderRole?: CommunicationRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunicationMessage extends Document {
  threadId: Types.ObjectId;
  orderNumber: string;
  senderId: Types.ObjectId;
  senderRole: CommunicationRole;
  senderName: string;
  body: string;
  readByAdmin: boolean;
  readByNotary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communicationThreadSchema = new Schema<ICommunicationThread>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'CompanyUser', index: true },
    notaryId: { type: Schema.Types.ObjectId, ref: 'NotaryUser', index: true },
    lastMessage: { type: String, trim: true },
    lastMessageAt: { type: Date },
    lastSenderRole: { type: String, enum: communicationRoles },
  },
  { timestamps: true },
);

const communicationMessageSchema = new Schema<ICommunicationMessage>(
  {
    threadId: { type: Schema.Types.ObjectId, ref: 'CommunicationThread', required: true, index: true },
    orderNumber: { type: String, required: true, trim: true, index: true },
    senderId: { type: Schema.Types.ObjectId, required: true, index: true },
    senderRole: { type: String, enum: communicationRoles, required: true, index: true },
    senderName: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    readByAdmin: { type: Boolean, default: false },
    readByNotary: { type: Boolean, default: false },
  },
  { timestamps: true },
);

communicationMessageSchema.index({ threadId: 1, createdAt: 1 });

export const CommunicationThread = model<ICommunicationThread>('CommunicationThread', communicationThreadSchema);
export const CommunicationMessage = model<ICommunicationMessage>('CommunicationMessage', communicationMessageSchema);
