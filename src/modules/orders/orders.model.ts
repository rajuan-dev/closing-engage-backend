import { Document, Schema, Types, model } from 'mongoose';

export const orderStatuses = [
  'Received',
  'Assigned',
  'In Progress',
  'Under Review',
  'Approved',
  'Completed',
  'Rejected',
  'Pending Upload',
  'Submitted',
] as const;
export const orderPriorities = ['Standard', 'Rush', 'High Touch', 'High', 'Low', 'Normal Processing', 'Urgent Request'] as const;
export const notaryPreferences = ['First available', 'Verified only', 'Manual assignment'] as const;
export const loanTypes = ['Refinance', 'Purchase', 'HELOC', 'Other'] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type OrderPriority = (typeof orderPriorities)[number];
export type NotaryPreference = (typeof notaryPreferences)[number];
export type LoanType = (typeof loanTypes)[number];

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

export interface IOrderMeeting {
  status: 'scheduled' | 'confirmed';
  date: string;
  time: string;
  scheduledByRole: 'admin' | 'company' | 'notary';
  scheduledAt: Date;
  confirmedByRole?: 'admin' | 'company' | 'notary';
  confirmedAt?: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  title?: string;
  titleCompany: string;
  companyInitials: string;
  companyId?: Types.ObjectId;
  clientName?: string;
  signerName?: string;
  signerPhone?: string;
  propertyAddress: string;
  signingDate: string;
  signingTime: string;
  loanType?: LoanType;
  scanbacksRequired: boolean;
  status: OrderStatus;
  priority: OrderPriority;
  notaryPreference: NotaryPreference;
  preferredNotaryName?: string;
  assignedNotaryId?: Types.ObjectId;
  assignedNotaryName: string;
  avatarKey: 'none' | 'jane' | 'mark';
  specialInstructions?: string;
  notaryNotes?: string;
  notaryPrintedConfirmed: boolean;
  meeting?: IOrderMeeting;
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

const orderMeetingSchema = new Schema<IOrderMeeting>(
  {
    status: { type: String, enum: ['scheduled', 'confirmed'], required: true, default: 'scheduled' },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    scheduledByRole: { type: String, enum: ['admin', 'company', 'notary'], required: true },
    scheduledAt: { type: Date, required: true, default: Date.now },
    confirmedByRole: { type: String, enum: ['admin', 'company', 'notary'] },
    confirmedAt: { type: Date },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, trim: true },
    titleCompany: { type: String, required: true, trim: true },
    companyInitials: { type: String, required: true, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'CompanyUser', index: true },
    clientName: { type: String, trim: true },
    signerName: { type: String, trim: true },
    signerPhone: { type: String, trim: true },
    propertyAddress: { type: String, required: true, trim: true },
    signingDate: { type: String, required: true, trim: true },
    signingTime: { type: String, required: true, trim: true },
    loanType: { type: String, enum: loanTypes },
    scanbacksRequired: { type: Boolean, default: false },
    status: { type: String, enum: orderStatuses, default: 'Received', index: true },
    priority: { type: String, enum: orderPriorities, default: 'Standard' },
    notaryPreference: { type: String, enum: notaryPreferences, default: 'First available' },
    preferredNotaryName: { type: String, trim: true },
    assignedNotaryId: { type: Schema.Types.ObjectId, ref: 'NotaryUser', index: true },
    assignedNotaryName: { type: String, default: 'Unassigned', trim: true },
    avatarKey: { type: String, enum: ['none', 'jane', 'mark'], default: 'none' },
    specialInstructions: { type: String, trim: true },
    notaryNotes: { type: String, trim: true },
    notaryPrintedConfirmed: { type: Boolean, default: false },
    meeting: { type: orderMeetingSchema, required: false },
    documents: { type: [orderDocumentSchema], default: [] },
    timeline: { type: [orderTimelineEventSchema], default: [] },
    createdByAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true },
);

orderSchema.index({ titleCompany: 1, status: 1 });
orderSchema.index({
  propertyAddress: 'text',
  titleCompany: 'text',
  orderNumber: 'text',
  assignedNotaryName: 'text',
  clientName: 'text',
  title: 'text',
});

export const Order = model<IOrder>('Order', orderSchema);
