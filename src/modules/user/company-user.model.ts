import { Document, Schema, model } from 'mongoose';

export interface ICompanyUser extends Document {
  companyName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending';
  address?: string;
  contactEmail?: string;
  userName?: string;
  passwordHash?: string;
  passwordResetOtp?: string;
  passwordResetExpiresAt?: Date;
  passwordResetVerifiedAt?: Date;
  sendInvite?: boolean;
  verify?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companyUserSchema = new Schema<ICompanyUser>(
  {
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    businessEmail: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
    address: { type: String },
    contactEmail: { type: String, trim: true, lowercase: true },
    userName: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String },
    passwordResetOtp: { type: String },
    passwordResetExpiresAt: { type: Date },
    passwordResetVerifiedAt: { type: Date },
    sendInvite: { type: Boolean, default: false },
    verify: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CompanyUser = model<ICompanyUser>('CompanyUser', companyUserSchema);
