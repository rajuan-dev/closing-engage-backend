import { Document, Schema, model } from 'mongoose';

export interface IAccessRequest extends Document {
  role: 'company' | 'notary';
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  contactType?: string;
  requestType?: string;
  commissionNumber?: string;
  commissionExpiration?: string;
  eoInsurance?: string;
  certifications?: string;
  coverageArea: string;
  message?: string;
  status: 'Pending' | 'Approved' | 'Declined';
  createdAt: Date;
  updatedAt: Date;
}

const accessRequestSchema = new Schema<IAccessRequest>(
  {
    role: { type: String, enum: ['company', 'notary'], required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: 'N/A' },
    companyName: { type: String },
    contactType: { type: String },
    requestType: { type: String },
    commissionNumber: { type: String },
    commissionExpiration: { type: String },
    eoInsurance: { type: String },
    certifications: { type: String },
    coverageArea: { type: String, required: true },
    message: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Declined'], default: 'Pending' },
  },
  { timestamps: true },
);

export const AccessRequest = model<IAccessRequest>('AccessRequest', accessRequestSchema);
