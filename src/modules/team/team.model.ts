import { Schema, model, Document } from 'mongoose';

export interface ITeamMember extends Document {
  name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Member';
  status: 'Active' | 'Pending Invite' | 'Inactive';
  joinedDate: string;
  companyId: string;
}

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
    status: { type: String, enum: ['Active', 'Pending Invite', 'Inactive'], default: 'Pending Invite' },
    joinedDate: { type: String, required: true },
    companyId: { type: String, required: true },
  },
  { timestamps: true }
);

export const TeamMember = model<ITeamMember>('TeamMember', teamMemberSchema);
