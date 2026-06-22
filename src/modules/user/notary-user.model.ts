import { Document, Schema, Types, model } from 'mongoose';

export type NotaryScreeningStatus = 'Pending' | 'Verified' | 'Failed';
export type NotaryCredentialVerification = 'Auto-Verified' | 'Manual Review';
export type NotaryCredentialStatus = 'Pending' | 'Approved' | 'Rejected';

export interface INotaryCredential {
  _id: Types.ObjectId;
  documentName: string;
  issuer: string;
  uploadDate: string;
  verification: NotaryCredentialVerification;
  status: NotaryCredentialStatus;
  reviewedAt?: Date;
}

export interface INotaryUser extends Document {
  publicId?: string;
  fullName: string;
  specialty: string;
  email: string;
  phone: string;
  license: string;
  status: 'Active' | 'Inactive' | 'Pending';
  expiry?: string;
  serviceArea?: string;
  avatarUrl?: string;
  userName?: string;
  commissionAuthority?: string;
  eoCoverage?: string;
  backgroundScreeningStatus?: NotaryScreeningStatus;
  backgroundScreeningDetail?: string;
  credentials?: Types.DocumentArray<INotaryCredential>;
  passwordHash?: string;
  adminVisiblePasswordCipher?: string;
  passwordResetOtp?: string;
  passwordResetExpiresAt?: Date;
  passwordResetVerifiedAt?: Date;
  passwordChangedBy?: 'admin' | 'user';
  passwordChangedAt?: Date;
  sendInvite?: boolean;
  verify?: boolean;
  notifications?: {
    email: boolean;
    orders: boolean;
    documents: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notaryCredentialSchema = new Schema<INotaryCredential>(
  {
    documentName: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    uploadDate: { type: String, required: true, trim: true },
    verification: {
      type: String,
      enum: ['Auto-Verified', 'Manual Review'],
      default: 'Manual Review',
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

const notaryUserSchema = new Schema<INotaryUser>(
  {
    publicId: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, default: 'Mobile Loan Signing Agent' },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    license: { type: String, default: '', trim: true },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
    expiry: { type: String },
    serviceArea: { type: String },
    avatarUrl: { type: String, trim: true },
    userName: { type: String, trim: true, unique: true, sparse: true },
    commissionAuthority: { type: String, trim: true, default: '' },
    eoCoverage: { type: String, trim: true, default: '' },
    backgroundScreeningStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Failed'],
      default: 'Pending',
    },
    backgroundScreeningDetail: { type: String, trim: true, default: '' },
    credentials: { type: [notaryCredentialSchema], default: [] },
    passwordHash: { type: String },
    adminVisiblePasswordCipher: { type: String },
    passwordResetOtp: { type: String },
    passwordResetExpiresAt: { type: Date },
    passwordResetVerifiedAt: { type: Date },
    passwordChangedBy: { type: String, enum: ['admin', 'user'], default: 'admin' },
    passwordChangedAt: { type: Date },
    sendInvite: { type: Boolean, default: false },
    verify: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      documents: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export const NotaryUser = model<INotaryUser>('NotaryUser', notaryUserSchema);
