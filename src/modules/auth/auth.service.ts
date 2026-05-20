import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { sendEmail } from '../email/email.service';
import { ITeamMember, TeamMember } from '../team/team.model';
import { CompanyUser, ICompanyUser } from '../user/company-user.model';
import { INotaryUser, NotaryUser } from '../user/notary-user.model';
import { AdminUser, IAdminUser } from './auth.model';

const LEGACY_SEED_ADMIN_EMAIL = 'admin@closingengage.com';
const DEFAULT_ADMIN_PROFILE = {
  fullName: 'Closing Engage Admin',
  phone: '+1 (555) 010-1000',
  companyName: 'Closing Engage',
  contactNumber: '+1 (555) 010-1000',
  businessAddress: 'Austin, Texas',
} as const;

interface AdminJwtPayload {
  sub: string;
  email: string;
  role: 'admin';
}

interface AuthJwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'company' | 'notary';
  companyId?: string;
  memberId?: string;
  memberRole?: 'Admin' | 'Member';
  permissions?: {
    createOrders: boolean;
    viewOrders: boolean;
    downloadDocuments: boolean;
  };
}

interface AdminProfileInput {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyEmail: string;
  contactNumber: string;
  businessAddress: string;
}

const sanitizeAdmin = (admin: IAdminUser) => ({
  id: admin._id.toString(),
  email: admin.email,
  role: admin.role,
  profile: {
    fullName: admin.fullName,
    email: admin.email,
    phone: admin.phone,
    companyName: admin.companyName,
    companyEmail: admin.companyEmail,
    contactNumber: admin.contactNumber,
    businessAddress: admin.businessAddress,
  },
});

const initialsFrom = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || value.trim().slice(0, 2).toUpperCase();

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const buildCompanyPublicId = (company: ICompanyUser): string => {
  const year = company.createdAt?.getFullYear?.() || new Date().getFullYear();
  const digest = crypto.createHash('sha1').update(company._id.toString()).digest('hex').slice(0, 6).toUpperCase();
  return `CE-COMP-${year}-${digest}`;
};

const buildNotaryPublicId = (notary: INotaryUser): string => {
  const year = notary.createdAt?.getFullYear?.() || new Date().getFullYear();
  const digest = crypto.createHash('sha1').update(notary._id.toString()).digest('hex').slice(0, 6).toUpperCase();
  return `CE-NOT-${year}-${digest}`;
};

const sanitizeCompany = (company: ICompanyUser) => ({
  id: company._id.toString(),
  publicId: company.publicId || buildCompanyPublicId(company),
  role: 'company' as const,
  initials: initialsFrom(company.companyName),
  color: 'bg-[#DCE7FF] text-[#3165CF]',
  companyName: company.companyName,
  contactPerson: company.contactPerson,
  businessEmail: company.businessEmail,
  email: company.businessEmail,
  phone: company.phone,
  status: company.status,
  createdDate: formatDate(company.createdAt),
  address: company.address ?? '',
  contactEmail: company.contactEmail ?? '',
  avatarUrl: company.avatarUrl ?? '',
  userName: company.userName ?? '',
  accountType: 'owner' as const,
  permissions: {
    createOrders: true,
    viewOrders: true,
    downloadDocuments: true,
  },
});

const sanitizeCompanyMember = (member: ITeamMember, company: ICompanyUser) => ({
  id: member._id.toString(),
  companyId: company._id.toString(),
  role: 'company' as const,
  accountType: 'team-member' as const,
  memberRole: member.role,
  name: member.name,
  fullName: member.name,
  email: member.email,
  phone: member.phone ?? '',
  status: member.status,
  companyName: company.companyName,
  businessEmail: company.businessEmail,
  contactEmail: company.contactEmail ?? '',
  address: company.address ?? '',
  avatarUrl: company.avatarUrl ?? '',
  permissions: member.permissions ?? {
    createOrders: true,
    viewOrders: true,
    downloadDocuments: false,
  },
});

const sanitizeNotary = (notary: INotaryUser) => ({
  id: notary._id.toString(),
  publicId: notary.publicId || buildNotaryPublicId(notary),
  role: 'notary' as const,
  initials: initialsFrom(notary.fullName),
  color: 'bg-[#FFE2D3] text-[#C66B33]',
  fullName: notary.fullName,
  name: notary.fullName,
  specialty: notary.specialty,
  email: notary.email,
  phone: notary.phone,
  license: notary.license,
  status: notary.status,
  createdDate: formatDate(notary.createdAt),
  expiry: notary.expiry ?? '',
  serviceArea: notary.serviceArea ?? '',
  avatarUrl: notary.avatarUrl ?? '',
  userName: notary.userName ?? '',
});

const createToken = (payload: { id: string; email: string; role: 'admin' | 'company' | 'notary' }): string =>
  jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

const createAdminToken = (admin: IAdminUser): string =>
  createToken({ id: admin._id.toString(), email: admin.email, role: admin.role });

const createCompanyToken = (company: ICompanyUser): string =>
  createToken({ id: company._id.toString(), email: company.businessEmail, role: 'company' });

const createCompanyMemberToken = (member: ITeamMember): string =>
  jwt.sign(
    {
      sub: member._id.toString(),
      companyId: member.companyId,
      memberId: member._id.toString(),
      memberRole: member.role,
      permissions: member.permissions,
      email: member.email,
      role: 'company',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );

const createNotaryToken = (notary: INotaryUser): string =>
  createToken({ id: notary._id.toString(), email: notary.email, role: 'notary' });

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const otpExpiryMinutes = 15;

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

type ResettableAccount =
  | { role: 'admin'; account: IAdminUser; email: string; displayName: string }
  | { role: 'company'; account: ICompanyUser; email: string; displayName: string }
  | { role: 'notary'; account: INotaryUser; email: string; displayName: string };

const findResettableAccount = async (
  email: string,
  role?: 'admin' | 'company' | 'notary',
): Promise<ResettableAccount | null> => {
  const normalizedEmail = normalizeEmail(email);

  if (!role || role === 'admin') {
    const admin = await AdminUser.findOne({ email: normalizedEmail, isActive: true });
    if (admin) return { role: 'admin', account: admin, email: admin.email, displayName: admin.fullName };
  }

  if (!role || role === 'company') {
    const company = await CompanyUser.findOne({
      $or: [{ businessEmail: normalizedEmail }, { contactEmail: normalizedEmail }],
      status: { $ne: 'Inactive' },
    });
    if (company) {
      return {
        role: 'company',
        account: company,
        email: company.businessEmail,
        displayName: company.contactPerson || company.companyName,
      };
    }
  }

  if (!role || role === 'notary') {
    const notary = await NotaryUser.findOne({ email: normalizedEmail, status: { $ne: 'Inactive' } });
    if (notary) return { role: 'notary', account: notary, email: notary.email, displayName: notary.fullName };
  }

  return null;
};

const safelySendPasswordResetEmail = async (target: ResettableAccount, otp: string): Promise<void> => {
  try {
    await sendEmail({
      to: target.email,
      subject: 'Closing Engage password reset code',
      html: `
        <h2>Password reset requested</h2>
        <p>Hello ${target.displayName},</p>
        <p>Use this verification code to reset your Closing Engage password:</p>
        <p><strong style="font-size: 24px;">${otp}</strong></p>
        <p>This code expires in ${otpExpiryMinutes} minutes.</p>
      `,
      text: [
        `Hello ${target.displayName},`,
        'Use this verification code to reset your Closing Engage password:',
        otp,
        `This code expires in ${otpExpiryMinutes} minutes.`,
      ].join('\n'),
    });
  } catch (error) {
    logger.error(
      { err: error, role: target.role, email: target.email, accountId: target.account._id.toString() },
      'Password reset code persisted, but reset email failed',
    );
  }
};

export const ensureSeedAdmin = async (): Promise<void> => {
  const seedEmail = env.ADMIN_SEED_EMAIL.trim().toLowerCase();
  const existingAdmin = await AdminUser.findOne({ email: seedEmail });

  if (existingAdmin) {
    const missingProfileFields = [
      existingAdmin.fullName,
      existingAdmin.phone,
      existingAdmin.companyName,
      existingAdmin.companyEmail,
      existingAdmin.contactNumber,
      existingAdmin.businessAddress,
    ].some((value) => !value?.trim());

    if (missingProfileFields) {
      existingAdmin.fullName = existingAdmin.fullName?.trim() || DEFAULT_ADMIN_PROFILE.fullName;
      existingAdmin.phone = existingAdmin.phone?.trim() || DEFAULT_ADMIN_PROFILE.phone;
      existingAdmin.companyName = existingAdmin.companyName?.trim() || DEFAULT_ADMIN_PROFILE.companyName;
      existingAdmin.companyEmail = existingAdmin.companyEmail?.trim() || seedEmail;
      existingAdmin.contactNumber = existingAdmin.contactNumber?.trim() || DEFAULT_ADMIN_PROFILE.contactNumber;
      existingAdmin.businessAddress = existingAdmin.businessAddress?.trim() || DEFAULT_ADMIN_PROFILE.businessAddress;
      await existingAdmin.save();
      logger.info({ email: seedEmail }, 'Default admin profile fields backfilled');
    }

    if (seedEmail !== LEGACY_SEED_ADMIN_EMAIL) {
      const legacySeedAdmin = await AdminUser.findOne({ email: LEGACY_SEED_ADMIN_EMAIL });
      if (legacySeedAdmin?.isActive) {
        legacySeedAdmin.isActive = false;
        await legacySeedAdmin.save();

        logger.info(
          {
            email: LEGACY_SEED_ADMIN_EMAIL,
            replacementEmail: seedEmail,
            adminId: legacySeedAdmin._id.toString(),
            action: 'legacy-seed-deactivated',
          },
          'Legacy seed admin deactivated',
        );
      }
    }

    logger.info(
      {
        email: existingAdmin.email,
        adminId: existingAdmin._id.toString(),
        seeded: true,
        action: missingProfileFields ? 'backfilled-and-skipped' : 'already-exists-skipped',
      },
      'Admin seed check completed',
    );

    return;
  }

  const legacySeedAdmin = await AdminUser.findOne({ email: LEGACY_SEED_ADMIN_EMAIL });

  if (legacySeedAdmin) {
    legacySeedAdmin.email = seedEmail;
    legacySeedAdmin.companyEmail = seedEmail;
    legacySeedAdmin.fullName = legacySeedAdmin.fullName?.trim() || DEFAULT_ADMIN_PROFILE.fullName;
    legacySeedAdmin.phone = legacySeedAdmin.phone?.trim() || DEFAULT_ADMIN_PROFILE.phone;
    legacySeedAdmin.companyName = legacySeedAdmin.companyName?.trim() || DEFAULT_ADMIN_PROFILE.companyName;
    legacySeedAdmin.contactNumber = legacySeedAdmin.contactNumber?.trim() || DEFAULT_ADMIN_PROFILE.contactNumber;
    legacySeedAdmin.businessAddress = legacySeedAdmin.businessAddress?.trim() || DEFAULT_ADMIN_PROFILE.businessAddress;
    await legacySeedAdmin.save();

    logger.info(
      {
        email: seedEmail,
        previousEmail: LEGACY_SEED_ADMIN_EMAIL,
        adminId: legacySeedAdmin._id.toString(),
        seeded: true,
        action: 'legacy-seed-email-updated',
      },
      'Admin seed check completed',
    );

    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_SEED_PASSWORD, 12);

  await AdminUser.create({
    email: seedEmail,
    passwordHash,
    role: 'admin',
    isActive: true,
    ...DEFAULT_ADMIN_PROFILE,
    companyEmail: seedEmail,
  });

  logger.info(
    {
      email: seedEmail,
      seeded: true,
      action: 'created',
    },
    'Admin seed check completed',
  );
};

export const loginAdmin = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await AdminUser.findOne({ email: normalizedEmail });

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  return {
    token: createAdminToken(admin),
    admin: sanitizeAdmin(admin),
  };
};

export const loginCompany = async (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const company = await CompanyUser.findOne({
    $or: [{ businessEmail: normalizedEmail }, { contactEmail: normalizedEmail }, { userName: email.trim() }],
  });

  if (!company || company.status !== 'Active' || !company.passwordHash) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, company.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  return {
    token: createCompanyToken(company),
    company: sanitizeCompany(company),
  };
};

export const loginCompanyMember = async (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const member = await TeamMember.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!member || member.status === 'Inactive' || !member.passwordHash) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const company = await CompanyUser.findById(member.companyId);
  if (!company || company.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, member.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  if (member.status === 'Pending Invite') {
    member.status = 'Active';
    member.joinedDate = formatDate(new Date());
    await member.save();
  }

  return {
    token: createCompanyMemberToken(member),
    company: sanitizeCompanyMember(member, company),
  };
};

export const loginNotary = async (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const notary = await NotaryUser.findOne({
    $or: [{ email: normalizedEmail }, { userName: email.trim() }],
  });

  if (!notary || notary.status !== 'Active' || !notary.passwordHash) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, notary.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  return {
    token: createNotaryToken(notary),
    notary: sanitizeNotary(notary),
  };
};

export const verifyAdminToken = (token: string): AdminJwtPayload => {
  const payload = verifyAuthToken(token);
  if (payload.role !== 'admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Admin role is required');
  }
  return payload as AdminJwtPayload;
};

export const verifyAuthToken = (token: string): AuthJwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthJwtPayload;
  } catch {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
  }
};

export const getCompanyById = async (id: string) => {
  const company = await CompanyUser.findById(id);

  if (!company || company.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Company account not found');
  }

  return sanitizeCompany(company);
};

export const getCompanyMemberSession = async (memberId: string) => {
  const member = await TeamMember.findById(memberId);

  if (!member || member.status === 'Inactive') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Company member account not found');
  }

  const company = await CompanyUser.findById(member.companyId);
  if (!company || company.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Company account not found');
  }

  return sanitizeCompanyMember(member, company);
};

export const getNotaryById = async (id: string) => {
  const notary = await NotaryUser.findById(id);

  if (!notary || notary.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Notary account not found');
  }

  return sanitizeNotary(notary);
};

export const loginPortalUser = async (emailOrUserName: string, password: string) => {
  try {
    const companyResult = await loginCompany(emailOrUserName, password);
    return {
      token: companyResult.token,
      role: 'company' as const,
      user: companyResult.company,
      redirectTo: '/company/dashboard',
    };
  } catch (error) {
    if (!(error instanceof HttpError) || error.statusCode !== StatusCodes.UNAUTHORIZED) {
      throw error;
    }
  }

  try {
    const memberResult = await loginCompanyMember(emailOrUserName, password);
    return {
      token: memberResult.token,
      role: 'company' as const,
      user: memberResult.company,
      redirectTo: '/company/dashboard',
    };
  } catch (error) {
    if (!(error instanceof HttpError) || error.statusCode !== StatusCodes.UNAUTHORIZED) {
      throw error;
    }
  }

  try {
    const notaryResult = await loginNotary(emailOrUserName, password);
    return {
      token: notaryResult.token,
      role: 'notary' as const,
      user: notaryResult.notary,
      redirectTo: '/notary/dashboard',
    };
  } catch (error) {
    if (!(error instanceof HttpError) || error.statusCode !== StatusCodes.UNAUTHORIZED) {
      throw error;
    }
  }

  throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
};

export const updateCompanyProfile = async (
  id: string,
  updates: Partial<{
    contactPerson: string;
    businessEmail: string;
    phone: string;
    companyName: string;
    contactEmail: string;
    address: string;
    avatarUrl: string;
  }>,
) => {
  const company = await CompanyUser.findById(id);

  if (!company || company.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Company account not found');
  }

  if (updates.contactPerson !== undefined) company.contactPerson = updates.contactPerson;
  if (updates.businessEmail !== undefined) company.businessEmail = normalizeEmail(updates.businessEmail);
  if (updates.phone !== undefined) company.phone = updates.phone;
  if (updates.companyName !== undefined) company.companyName = updates.companyName;
  if (updates.contactEmail !== undefined) company.contactEmail = normalizeEmail(updates.contactEmail);
  if (updates.address !== undefined) company.address = updates.address;
  if (updates.avatarUrl !== undefined) company.avatarUrl = updates.avatarUrl;

  await company.save();
  return sanitizeCompany(company);
};

export const updateNotaryProfile = async (
  id: string,
  updates: Partial<{
    fullName: string;
    specialty: string;
    email: string;
    phone: string;
    license: string;
    expiry: string;
    serviceArea: string;
    avatarUrl: string;
  }>,
) => {
  const notary = await NotaryUser.findById(id);

  if (!notary || notary.status !== 'Active') {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Notary account not found');
  }

  if (updates.fullName !== undefined) notary.fullName = updates.fullName;
  if (updates.specialty !== undefined) notary.specialty = updates.specialty;
  if (updates.email !== undefined) notary.email = normalizeEmail(updates.email);
  if (updates.phone !== undefined) notary.phone = updates.phone;
  if (updates.license !== undefined) notary.license = updates.license;
  if (updates.expiry !== undefined) notary.expiry = updates.expiry;
  if (updates.serviceArea !== undefined) notary.serviceArea = updates.serviceArea;
  if (updates.avatarUrl !== undefined) notary.avatarUrl = updates.avatarUrl;

  await notary.save();
  return sanitizeNotary(notary);
};

export const updateCompanyPassword = async (id: string, currentPassword: string, newPassword: string): Promise<void> => {
  const company = await CompanyUser.findById(id);

  if (!company || company.status !== 'Active' || !company.passwordHash) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Company account not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, company.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  company.passwordHash = await bcrypt.hash(newPassword, 12);
  company.adminVisiblePasswordCipher = undefined;
  company.passwordChangedBy = 'user';
  company.passwordChangedAt = new Date();
  await company.save();
};

export const updateNotaryPassword = async (id: string, currentPassword: string, newPassword: string): Promise<void> => {
  const notary = await NotaryUser.findById(id);

  if (!notary || notary.status !== 'Active' || !notary.passwordHash) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Notary account not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, notary.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  notary.passwordHash = await bcrypt.hash(newPassword, 12);
  notary.adminVisiblePasswordCipher = undefined;
  notary.passwordChangedBy = 'user';
  notary.passwordChangedAt = new Date();
  await notary.save();
};

export const requestPasswordReset = async (email: string, role?: 'admin' | 'company' | 'notary') => {
  const target = await findResettableAccount(email, role);

  if (!target) {
    logger.info({ email: normalizeEmail(email), role }, 'Password reset requested for unknown account');
    return;
  }

  const otp = generateOtp();
  target.account.passwordResetOtp = await bcrypt.hash(otp, 12);
  target.account.passwordResetExpiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);
  target.account.passwordResetVerifiedAt = undefined;
  await target.account.save();

  await safelySendPasswordResetEmail(target, otp);
};

export const verifyPasswordResetOtp = async (email: string, otp: string, role?: 'admin' | 'company' | 'notary') => {
  const target = await findResettableAccount(email, role);

  if (!target || !target.account.passwordResetOtp || !target.account.passwordResetExpiresAt) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Invalid or expired verification code');
  }

  if (target.account.passwordResetExpiresAt.getTime() < Date.now()) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Invalid or expired verification code');
  }

  const isOtpValid = await bcrypt.compare(otp, target.account.passwordResetOtp);

  if (!isOtpValid) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Invalid or expired verification code');
  }

  target.account.passwordResetVerifiedAt = new Date();
  await target.account.save();
};

export const resetPasswordWithOtp = async (
  email: string,
  otp: string,
  newPassword: string,
  role?: 'admin' | 'company' | 'notary',
) => {
  const target = await findResettableAccount(email, role);

  if (!target || !target.account.passwordResetOtp || !target.account.passwordResetExpiresAt) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Invalid or expired verification code');
  }

  if (target.account.passwordResetExpiresAt.getTime() < Date.now()) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Invalid or expired verification code');
  }

  const isOtpValid = await bcrypt.compare(otp, target.account.passwordResetOtp);

  if (!isOtpValid) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Invalid or expired verification code');
  }

  target.account.passwordHash = await bcrypt.hash(newPassword, 12);
  if (target.role === 'company' || target.role === 'notary') {
    target.account.adminVisiblePasswordCipher = undefined;
    target.account.passwordChangedBy = 'user';
    target.account.passwordChangedAt = new Date();
  }
  target.account.passwordResetOtp = undefined;
  target.account.passwordResetExpiresAt = undefined;
  target.account.passwordResetVerifiedAt = undefined;
  await target.account.save();
};

export const getAdminById = async (id: string) => {
  const admin = await AdminUser.findById(id);

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
  }

  return sanitizeAdmin(admin);
};

export const updateAdminProfile = async (id: string, updates: AdminProfileInput) => {
  const admin = await AdminUser.findById(id);

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
  }

  admin.fullName = updates.fullName;
  admin.email = updates.email.trim().toLowerCase();
  admin.phone = updates.phone;
  admin.companyName = updates.companyName;
  admin.companyEmail = updates.companyEmail.trim().toLowerCase();
  admin.contactNumber = updates.contactNumber;
  admin.businessAddress = updates.businessAddress;

  await admin.save();

  return sanitizeAdmin(admin);
};

export const updateAdminPassword = async (id: string, currentPassword: string, newPassword: string): Promise<void> => {
  const admin = await AdminUser.findById(id);

  if (!admin || !admin.isActive) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();
};
