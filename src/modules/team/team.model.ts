import { Schema, model, Document } from 'mongoose';

export interface ITeamMember extends Document {
  name: string;
  email: string;
  phone?: string;
  role: 'Admin' | 'Member';
  status: 'Active' | 'Pending Invite' | 'Inactive';
  joinedDate: string;
  companyId: string;
  passwordHash?: string;
  passwordChangedAt?: Date;
  permissions: {
    createOrders: boolean;
    viewOrders: boolean;
    downloadDocuments: boolean;
  };
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
    passwordHash: { type: String, select: false },
    passwordChangedAt: { type: Date },
    permissions: {
      createOrders: { type: Boolean, default: true },
      viewOrders: { type: Boolean, default: true },
      downloadDocuments: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const sanitized = ret as Record<string, unknown>;
        delete sanitized.passwordHash;
        delete sanitized.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        const sanitized = ret as Record<string, unknown>;
        delete sanitized.passwordHash;
        delete sanitized.__v;
        return ret;
      },
    },
  }
);

export const TeamMember = model<ITeamMember>('TeamMember', teamMemberSchema);
