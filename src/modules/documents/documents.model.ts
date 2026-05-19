import { Document, Schema, Types, model } from 'mongoose';

export const documentStatuses = ['Pending Review', 'Approved', 'Rejected', 'Submitted', 'Pending', 'Verified'] as const;
export const uploaderRoles = ['admin', 'company', 'notary', 'buyer', 'title-company'] as const;

export type DocumentStatus = (typeof documentStatuses)[number];
export type UploaderRole = (typeof uploaderRoles)[number];

export interface IDocumentVersion {
  s3Key: string;
  versionId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: Types.ObjectId;
  uploaderRole: UploaderRole;
  uploadedAt: Date;
}

export interface IClosingDocument extends Document {
  orderId?: Types.ObjectId;
  orderNumber: string;
  fileName: string;
  fileSize: number;
  sizeLabel?: string;
  mimeType: string;
  uploadedBy?: Types.ObjectId;
  uploadedByName: string;
  uploaderRole: UploaderRole;
  status: DocumentStatus;
  comments?: string;
  isLocked: boolean;
  s3Key: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  versions: IDocumentVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const documentVersionSchema = new Schema<IDocumentVersion>(
  {
    s3Key: { type: String, required: true, trim: true },
    versionId: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    fileSize: { type: Number, default: 0, min: 0 },
    mimeType: { type: String, default: 'application/pdf', trim: true },
    uploadedBy: { type: Schema.Types.ObjectId },
    uploaderRole: { type: String, enum: uploaderRoles, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const documentSchema = new Schema<IClosingDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    orderNumber: { type: String, required: true, trim: true, index: true },
    fileName: { type: String, required: true, trim: true },
    fileSize: { type: Number, default: 0, min: 0 },
    sizeLabel: { type: String, trim: true },
    mimeType: { type: String, default: 'application/pdf', trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, index: true },
    uploadedByName: { type: String, required: true, trim: true },
    uploaderRole: { type: String, enum: uploaderRoles, required: true, index: true },
    status: { type: String, enum: documentStatuses, default: 'Pending Review', index: true },
    comments: { type: String, trim: true },
    isLocked: { type: Boolean, default: false },
    s3Key: { type: String, required: true, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId },
    reviewedAt: { type: Date },
    versions: { type: [documentVersionSchema], default: [] },
  },
  { timestamps: true },
);

documentSchema.index({ fileName: 'text', orderNumber: 'text', uploadedByName: 'text' });

export const ClosingDocument = model<IClosingDocument>('ClosingDocument', documentSchema);
