import { Document, Schema, model } from 'mongoose';

export interface INotaryUser extends Document {
  fullName: string;
  specialty: string;
  email: string;
  phone: string;
  license: string;
  status: 'Active' | 'Inactive' | 'Pending';
  expiry?: string;
  serviceArea?: string;
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

const notaryUserSchema = new Schema<INotaryUser>(
  {
    fullName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, default: 'Mobile Loan Signing Agent' },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    license: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Active' },
    expiry: { type: String },
    serviceArea: { type: String },
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

export const NotaryUser = model<INotaryUser>('NotaryUser', notaryUserSchema);
