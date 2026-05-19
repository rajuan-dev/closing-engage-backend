import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { env } from '../../config/env';
import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { sendResponse } from '../../core/response';
import { sendEmail } from '../email/email.service';
import { CompanyUser } from '../user/company-user.model';
import { TeamMember } from './team.model';

const permissionSchema = z.object({
  createOrders: z.boolean().default(true),
  viewOrders: z.boolean().default(true),
  downloadDocuments: z.boolean().default(false),
});

const createTeamMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().optional(),
  role: z.enum(['Admin', 'Member']).default('Member'),
  status: z.enum(['Active', 'Pending Invite', 'Inactive']).optional(),
  permissions: permissionSchema.optional(),
  sendInvite: z.boolean().optional(),
});

const updateTeamMemberSchema = createTeamMemberSchema.partial();
const paramsSchema = z.object({ email: z.string().trim().email() });

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

const generateTemporaryPassword = (): string => crypto.randomBytes(9).toString('base64url');

const assertCanManageTeam = (req: Request): void => {
  if (req.company?.memberId && req.company.memberRole !== 'Admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only company admins can manage team members');
  }
};

const serializeTeamMember = (member: Awaited<ReturnType<typeof TeamMember.findOne>>) => {
  if (!member) return null;
  const permissions = member.permissions ?? {
    createOrders: true,
    viewOrders: true,
    downloadDocuments: false,
  };

  return {
    id: member._id.toString(),
    name: member.name,
    email: member.email,
    phone: member.phone ?? '',
    role: member.role,
    status: member.status,
    joinedDate: member.joinedDate,
    companyId: member.companyId,
    permissions,
  };
};

const sendInviteEmail = async (input: {
  companyName: string;
  memberName: string;
  email: string;
  password: string;
}) => {
  const loginUrl = `${env.WEBSITE_BASE_URL}/login`;

  return sendEmail({
    to: input.email,
    bcc: env.ADMIN_SEED_EMAIL,
    subject: `${input.companyName} invited you to Closing Engage`,
    html: `
      <h2>You have been invited to Closing Engage</h2>
      <p>Hello ${input.memberName},</p>
      <p>${input.companyName} added you as a team member.</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Temporary Password:</strong> ${input.password}</p>
      <p><a href="${loginUrl}">Sign in to Closing Engage</a></p>
    `,
    text: [
      'You have been invited to Closing Engage',
      `Company: ${input.companyName}`,
      `Email: ${input.email}`,
      `Temporary Password: ${input.password}`,
      `Login: ${loginUrl}`,
    ].join('\n'),
  });
};

const safelySendInviteEmail = async (input: {
  companyName: string;
  memberName: string;
  email: string;
  password: string;
}) => {
  try {
    return await sendInviteEmail(input);
  } catch (error) {
    logger.error(
      { err: error, email: input.email, companyName: input.companyName },
      'Team member created, but invite email delivery failed',
    );
    return { delivered: false };
  }
};

export const getTeamMembers = async (req: Request, res: Response) => {
  assertCanManageTeam(req);
  const members = await TeamMember.find({ companyId: req.company!.id }).sort({ createdAt: -1 });

  return sendResponse(res, {
    success: true,
    message: 'Team members fetched successfully',
    data: members.map(serializeTeamMember),
  });
};

export const createTeamMember = async (req: Request, res: Response) => {
  assertCanManageTeam(req);
  const payload = createTeamMemberSchema.parse(req.body);
  const company = await CompanyUser.findById(req.company!.id);

  if (!company || company.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Company account not found');
  }

  const email = payload.email.trim().toLowerCase();
  const existing = await TeamMember.findOne({ email });
  if (existing) {
    throw new HttpError(
      StatusCodes.CONFLICT,
      existing.companyId === company._id.toString()
        ? 'This email is already on your team. Edit the existing member to change permissions or role.'
        : 'A team member with this email already belongs to another company workspace',
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const member = await TeamMember.create({
    name: payload.name,
    email,
    phone: payload.phone,
    role: payload.role,
    status: payload.status ?? 'Pending Invite',
    joinedDate: payload.status === 'Active' ? formatDate(new Date()) : '—',
    companyId: company._id.toString(),
    passwordHash: await bcrypt.hash(temporaryPassword, 12),
    passwordChangedAt: new Date(),
    permissions: payload.permissions ?? {
      createOrders: true,
      viewOrders: true,
      downloadDocuments: false,
    },
  });

  let inviteDelivered = false;
  if (payload.sendInvite !== false) {
    const result = await safelySendInviteEmail({
      companyName: company.companyName,
      memberName: member.name,
      email: member.email,
      password: temporaryPassword,
    });
    inviteDelivered = result.delivered;
  }

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: inviteDelivered
      ? 'Team member invited successfully'
      : 'Team member created. Email delivery is not configured, so use the temporary password manually.',
    data: {
      member: serializeTeamMember(member),
      temporaryPassword,
      inviteDelivered,
    },
  });
};

export const updateTeamMember = async (req: Request, res: Response) => {
  assertCanManageTeam(req);
  const { email } = paramsSchema.parse(req.params);
  const payload = updateTeamMemberSchema.parse(req.body);

  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.email !== undefined) updates.email = payload.email.trim().toLowerCase();
  if (payload.phone !== undefined) updates.phone = payload.phone;
  if (payload.role !== undefined) updates.role = payload.role;
  if (payload.status !== undefined) {
    updates.status = payload.status;
    if (payload.status === 'Active') updates.joinedDate = formatDate(new Date());
  }
  if (payload.permissions !== undefined) updates.permissions = payload.permissions;

  const member = await TeamMember.findOneAndUpdate(
    { email: email.toLowerCase(), companyId: req.company!.id },
    updates,
    { new: true },
  );

  if (!member) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Member not found');
  }

  return sendResponse(res, {
    success: true,
    message: 'Team member updated successfully',
    data: serializeTeamMember(member),
  });
};

export const deleteTeamMember = async (req: Request, res: Response) => {
  assertCanManageTeam(req);
  const { email } = paramsSchema.parse(req.params);
  const member = await TeamMember.findOneAndDelete({ email: email.toLowerCase(), companyId: req.company!.id });

  if (!member) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Member not found');
  }

  return sendResponse(res, {
    success: true,
    message: 'Member deleted successfully',
  });
};
