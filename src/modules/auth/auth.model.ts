import { Document, Schema, model } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  role: 'admin';
  isActive: boolean;
  passwordResetOtp?: string;
  passwordResetExpiresAt?: Date;
  passwordResetVerifiedAt?: Date;
  fullName: string;
  phone: string;
  companyName: string;
  companyEmail: string;
  contactNumber: string;
  businessAddress: string;
  avatarUrl?: string;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    passwordResetOtp: { type: String },
    passwordResetExpiresAt: { type: Date },
    passwordResetVerifiedAt: { type: Date },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    companyEmail: { type: String, required: true, trim: true, lowercase: true },
    contactNumber: { type: String, required: true, trim: true },
    businessAddress: { type: String, required: true, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true },
);

export const AdminUser = model<IAdminUser>('AdminUser', adminUserSchema);
