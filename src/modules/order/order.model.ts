import { Document, Schema, Types, model } from 'mongoose';

export const orderStatuses = ['Received', 'Assigned', 'Under Review', 'Approved', 'Completed', 'Rejected'] as const;
export const orderPriorities = ['Standard', 'Rush', 'High Touch'] as const;
export const notaryPreferences = ['First available', 'Verified only', 'Manual assignment'] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type OrderPriority = (typeof orderPriorities)[number];
export type NotaryPreference = (typeof notaryPreferences)[number];

export interface IOrderDocument {
  name: string;
  meta: string;
  uploadedBy: 'Admin' | 'Title Company' | 'Notary';
  uploadedAt: Date;
}

export interface IOrderTimelineEvent {
  title: string;
  date: Date;
  tone: 'blue' | 'slate' | 'green' | 'red';
}

export interface IOrder extends Document {
  orderNumber: string;
  titleCompany: string;
  companyInitials: string;
  companyId?: Types.ObjectId;
  signerName?: string;
  signerPhone?: string;
  propertyAddress: string;
  signingDate: string;
  signingTime: string;
  status: OrderStatus;
  priority: OrderPriority;
  notaryPreference: NotaryPreference;
  assignedNotaryId?: Types.ObjectId;
  assignedNotaryName: string;
  avatarKey: 'none' | 'jane' | 'mark';
  specialInstructions?: string;
  documents: IOrderDocument[];
  timeline: IOrderTimelineEvent[];
  createdByAdminId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderDocumentSchema = new Schema<IOrderDocument>(
  {
    name: { type: String, required: true, trim: true },
    meta: { type: String, required: true, trim: true },
    uploadedBy: { type: String, enum: ['Admin', 'Title Company', 'Notary'], default: 'Admin' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderTimelineEventSchema = new Schema<IOrderTimelineEvent>(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    tone: { type: String, enum: ['blue', 'slate', 'green', 'red'], default: 'blue' },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, index: true },
    titleCompany: { type: String, required: true, trim: true },
    companyInitials: { type: String, required: true, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'CompanyUser', index: true },
    signerName: { type: String, trim: true },
    signerPhone: { type: String, trim: true },
    propertyAddress: { type: String, required: true, trim: true },
    signingDate: { type: String, required: true, trim: true },
    signingTime: { type: String, required: true, trim: true },
    status: { type: String, enum: orderStatuses, default: 'Received', index: true },
    priority: { type: String, enum: orderPriorities, default: 'Standard' },
    notaryPreference: { type: String, enum: notaryPreferences, default: 'First available' },
    assignedNotaryId: { type: Schema.Types.ObjectId, ref: 'NotaryUser', index: true },
    assignedNotaryName: { type: String, default: 'Unassigned', trim: true },
    avatarKey: { type: String, enum: ['none', 'jane', 'mark'], default: 'none' },
    specialInstructions: { type: String, trim: true },
    documents: { type: [orderDocumentSchema], default: [] },
    timeline: { type: [orderTimelineEventSchema], default: [] },
    createdByAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true },
);

orderSchema.index({ titleCompany: 1, status: 1 });
orderSchema.index({ propertyAddress: 'text', titleCompany: 'text', orderNumber: 'text', assignedNotaryName: 'text' });

export const Order = model<IOrder>('Order', orderSchema);
