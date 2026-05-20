import { Document, Schema, model } from 'mongoose';

export interface ICompanyUser extends Document {
  publicId?: string;
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending';
  address?: string;
  contactEmail?: string;
  avatarUrl?: string;
  userName?: string;
  passwordHash?: string;
  adminVisiblePasswordCipher?: string;
  passwordResetOtp?: string;
  passwordResetExpiresAt?: Date;
  passwordResetVerifiedAt?: Date;
  passwordChangedBy?: 'admin' | 'user';
  passwordChangedAt?: Date;
  sendInvite?: boolean;
  verify?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companyUserSchema = new Schema<ICompanyUser>(
  {
    publicId: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    businessEmail: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
    address: { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
    avatarUrl: { type: String, trim: true },
    userName: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String },
    adminVisiblePasswordCipher: { type: String },
    passwordResetOtp: { type: String },
    passwordResetExpiresAt: { type: Date },
    passwordResetVerifiedAt: { type: Date },
    passwordChangedBy: { type: String, enum: ['admin', 'user'], default: 'admin' },
    passwordChangedAt: { type: Date },
    sendInvite: { type: Boolean, default: false },
    verify: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CompanyUser = model<ICompanyUser>('CompanyUser', companyUserSchema);
