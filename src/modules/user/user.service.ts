import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { sendEmail } from '../email/email.service';
import { notifyAdminsSafely } from '../notifications/notifications.service';
import { CompanyUser, ICompanyUser } from './company-user.model';
import { INotaryUser, NotaryUser } from './notary-user.model';

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const companyColor = 'bg-[#DCE7FF] text-[#3165CF]';
const notaryColor = 'bg-[#FFE2D3] text-[#C66B33]';
const visiblePasswordKey = crypto.createHash('sha256').update(env.JWT_SECRET).digest();

const initialsFrom = (value: string) => value.trim().slice(0, 2).toUpperCase();
const generateTemporaryPassword = (): string => crypto.randomBytes(9).toString('base64url');
const encryptVisiblePassword = (password: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', visiblePasswordKey, iv);
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
};

const decryptVisiblePassword = (value?: string): string | undefined => {
  if (!value) return undefined;

  try {
    const [ivEncoded, tagEncoded, encryptedEncoded] = value.split('.');
    if (!ivEncoded || !tagEncoded || !encryptedEncoded) return undefined;

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      visiblePasswordKey,
      Buffer.from(ivEncoded, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    logger.warn({ err: error }, 'Failed to decrypt admin-visible password');
    return undefined;
  }
};
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

const ensureCompanyPublicId = async (company: ICompanyUser): Promise<ICompanyUser> => {
  if (company.publicId) return company;

  company.publicId = buildCompanyPublicId(company);
  await company.save();
  return company;
};

const ensureNotaryPublicId = async (notary: INotaryUser): Promise<INotaryUser> => {
  if (notary.publicId) return notary;

  notary.publicId = buildNotaryPublicId(notary);
  await notary.save();
  return notary;
};

const serializeCompanyUser = (company: ICompanyUser) => ({
  id: company._id.toString(),
  publicId: company.publicId || buildCompanyPublicId(company),
  initials: initialsFrom(company.companyName),
  color: companyColor,
  companyName: company.companyName,
  contactPerson: company.contactPerson,
  businessEmail: company.businessEmail,
  phone: company.phone,
  status: company.status,
  createdDate: formatDate(company.createdAt),
  address: company.address ?? '',
  contactEmail: company.contactEmail ?? '',
  userName: company.userName ?? '',
  avatarUrl: company.avatarUrl ?? '',
  sendInvite: company.sendInvite ?? false,
  verify: company.verify ?? false,
  adminVisiblePassword:
    company.passwordChangedBy !== 'user' ? decryptVisiblePassword(company.adminVisiblePasswordCipher) : undefined,
  passwordChangedBy: company.passwordChangedBy ?? 'admin',
  passwordChangedAt: company.passwordChangedAt?.toISOString() ?? company.createdAt.toISOString(),
  passwordStatus:
    company.passwordChangedBy === 'user'
      ? 'Password changed by user'
      : 'Password is not reset or changed by user',
});

const serializeNotaryUser = (notary: INotaryUser) => ({
  id: notary._id.toString(),
  publicId: notary.publicId || buildNotaryPublicId(notary),
  initials: initialsFrom(notary.fullName),
  color: notaryColor,
  fullName: notary.fullName,
  specialty: notary.specialty,
  email: notary.email,
  phone: notary.phone,
  license: notary.license,
  status: notary.status,
  createdDate: formatDate(notary.createdAt),
  expiry: notary.expiry ?? '',
  serviceArea: notary.serviceArea ?? '',
  userName: notary.userName ?? '',
  avatarUrl: notary.avatarUrl ?? '',
  sendInvite: notary.sendInvite ?? false,
  verify: notary.verify ?? false,
  adminVisiblePassword:
    notary.passwordChangedBy !== 'user' ? decryptVisiblePassword(notary.adminVisiblePasswordCipher) : undefined,
  passwordChangedBy: notary.passwordChangedBy ?? 'admin',
  passwordChangedAt: notary.passwordChangedAt?.toISOString() ?? notary.createdAt.toISOString(),
  passwordStatus:
    notary.passwordChangedBy === 'user'
      ? 'Password changed by user'
      : 'Password is not reset or changed by user',
});

const sendCompanyInviteEmail = async (company: ReturnType<typeof serializeCompanyUser>, password?: string) => {
  const targetEmail = company.contactEmail || company.businessEmail;
  const loginUrl = `${env.WEBSITE_BASE_URL}/login`;

  return sendEmail({
    to: targetEmail,
    bcc: env.ADMIN_SEED_EMAIL,
    subject: 'Your Closing Engage company account is ready',
    html: `
      <h2>Welcome to Closing Engage</h2>
      <p>Your company account has been created by an administrator.</p>
      <p><strong>Company:</strong> ${company.companyName}</p>
      <p><strong>User Name:</strong> ${company.userName || 'Not provided'}</p>
      <p><strong>Email:</strong> ${targetEmail}</p>
      <p><strong>Temporary Password:</strong> ${password ?? 'Use the password provided separately.'}</p>
      <p><a href="${loginUrl}">Sign in to Closing Engage</a></p>
    `,
    text: [
      'Welcome to Closing Engage',
      `Company: ${company.companyName}`,
      `User Name: ${company.userName || 'Not provided'}`,
      `Email: ${targetEmail}`,
      `Temporary Password: ${password ?? 'Use the password provided separately.'}`,
      `Login: ${loginUrl}`,
    ].join('\n'),
  });
};

const sendNotaryInviteEmail = async (notary: ReturnType<typeof serializeNotaryUser>, password?: string) => {
  const loginUrl = `${env.WEBSITE_BASE_URL}/login`;

  return sendEmail({
    to: notary.email,
    bcc: env.ADMIN_SEED_EMAIL,
    subject: 'Your Closing Engage notary account is ready',
    html: `
      <h2>Welcome to Closing Engage</h2>
      <p>Your notary account has been created by an administrator.</p>
      <p><strong>Name:</strong> ${notary.fullName}</p>
      <p><strong>Email:</strong> ${notary.email}</p>
      <p><strong>User Name:</strong> ${notary.userName || 'Not provided'}</p>
      <p><strong>Temporary Password:</strong> ${password ?? 'Use the password provided separately.'}</p>
      <p><a href="${loginUrl}">Sign in to Closing Engage</a></p>
    `,
    text: [
      'Welcome to Closing Engage',
      `Name: ${notary.fullName}`,
      `Email: ${notary.email}`,
      `User Name: ${notary.userName || 'Not provided'}`,
      `Temporary Password: ${password ?? 'Use the password provided separately.'}`,
      `Login: ${loginUrl}`,
    ].join('\n'),
  });
};

const safelySendCompanyInviteEmail = async (
  company: ReturnType<typeof serializeCompanyUser>,
  password?: string,
): Promise<void> => {
  try {
    const result = await sendCompanyInviteEmail(company, password);
    void notifyAdminsSafely({
      title: result.delivered ? 'Company Invite Email Sent' : 'Company Invite Email Skipped',
      message: result.delivered
        ? `Invitation sent to ${company.contactEmail || company.businessEmail}. A copy was BCC'd to ${env.ADMIN_SEED_EMAIL}.`
        : `Company user ${company.companyName} was created, but email delivery was skipped because Resend is not configured.`,
      type: 'user',
      linkId: company.id,
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        companyId: company.id,
        companyName: company.companyName,
        targetEmail: company.contactEmail || company.businessEmail,
      },
      'Company user persisted, but invite email failed',
    );
    void notifyAdminsSafely({
      title: 'Company Invite Email Failed',
      message: `Company user ${company.companyName} was created, but invitation email to ${company.contactEmail || company.businessEmail} failed.`,
      type: 'user',
      linkId: company.id,
    });
  }
};

const safelySendNotaryInviteEmail = async (
  notary: ReturnType<typeof serializeNotaryUser>,
  password?: string,
): Promise<void> => {
  try {
    const result = await sendNotaryInviteEmail(notary, password);
    void notifyAdminsSafely({
      title: result.delivered ? 'Notary Invite Email Sent' : 'Notary Invite Email Skipped',
      message: result.delivered
        ? `Invitation sent to ${notary.email}. A copy was BCC'd to ${env.ADMIN_SEED_EMAIL}.`
        : `Notary user ${notary.fullName} was created, but email delivery was skipped because Resend is not configured.`,
      type: 'user',
      linkId: notary.id,
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        notaryId: notary.id,
        fullName: notary.fullName,
        targetEmail: notary.email,
      },
      'Notary user persisted, but invite email failed',
    );
    void notifyAdminsSafely({
      title: 'Notary Invite Email Failed',
      message: `Notary user ${notary.fullName} was created, but invitation email to ${notary.email} failed.`,
      type: 'user',
      linkId: notary.id,
    });
  }
};

export const listCompanies = async () => {
  const companies = await CompanyUser.find().sort({ createdAt: -1 });
  const companiesWithPublicIds = await Promise.all(companies.map(ensureCompanyPublicId));
  return companiesWithPublicIds.map(serializeCompanyUser);
};

export const createCompany = async (payload: {
  companyName: string;
  businessEmail: string;
  phone: string;
  contactPerson: string;
  address?: string;
  contactEmail?: string;
  userName?: string;
  password?: string;
  sendInvite?: boolean;
  status: 'Active' | 'Inactive' | 'Pending';
  verify?: boolean;
}) => {
  const temporaryPassword = payload.password || generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const company = new CompanyUser({
    ...payload,
    businessEmail: payload.businessEmail.trim().toLowerCase(),
    contactEmail: payload.contactEmail?.trim().toLowerCase(),
    passwordHash,
    adminVisiblePasswordCipher: encryptVisiblePassword(temporaryPassword),
    passwordChangedBy: 'admin',
    passwordChangedAt: new Date(),
  });
  company.publicId = buildCompanyPublicId(company);
  await company.save();

  const serialized = serializeCompanyUser(company);

  if (payload.sendInvite) {
    await safelySendCompanyInviteEmail(serialized, temporaryPassword);
  }

  return serialized;
};

export const updateCompany = async (
  id: string,
  payload: Partial<{
    companyName: string;
    businessEmail: string;
    phone: string;
    contactPerson: string;
    address?: string;
    contactEmail?: string;
    userName?: string;
    password?: string;
    sendInvite?: boolean;
    status: 'Active' | 'Inactive' | 'Pending';
    verify?: boolean;
  }>,
) => {
  const company = await CompanyUser.findById(id);

  if (!company) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Company user not found');
  }

  if (payload.companyName !== undefined) company.companyName = payload.companyName;
  if (payload.businessEmail !== undefined) company.businessEmail = payload.businessEmail.trim().toLowerCase();
  if (payload.phone !== undefined) company.phone = payload.phone;
  if (payload.contactPerson !== undefined) company.contactPerson = payload.contactPerson;
  if (payload.address !== undefined) company.address = payload.address;
  if (payload.contactEmail !== undefined) company.contactEmail = payload.contactEmail.trim().toLowerCase();
  if (payload.userName !== undefined) company.userName = payload.userName;
  if (payload.sendInvite !== undefined) company.sendInvite = payload.sendInvite;
  if (payload.status !== undefined) company.status = payload.status;
  if (payload.verify !== undefined) company.verify = payload.verify;
  if (payload.password) {
    company.passwordHash = await bcrypt.hash(payload.password, 12);
    company.adminVisiblePasswordCipher = encryptVisiblePassword(payload.password);
    company.passwordChangedBy = 'admin';
    company.passwordChangedAt = new Date();
  }

  await company.save();
  await ensureCompanyPublicId(company);

  const serialized = serializeCompanyUser(company);

  if (payload.sendInvite) {
    await safelySendCompanyInviteEmail(serialized, payload.password);
  }

  return serialized;
};

export const deleteCompany = async (id: string): Promise<void> => {
  const company = await CompanyUser.findByIdAndDelete(id);
  if (!company) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Company user not found');
  }
};

export const listNotaries = async () => {
  const notaries = await NotaryUser.find().sort({ createdAt: -1 });
  const notariesWithPublicIds = await Promise.all(notaries.map(ensureNotaryPublicId));
  return notariesWithPublicIds.map(serializeNotaryUser);
};

export const createNotary = async (payload: {
  fullName: string;
  specialty?: string;
  email: string;
  phone: string;
  license: string;
  expiry?: string;
  serviceArea?: string;
  userName?: string;
  password?: string;
  sendInvite?: boolean;
  status: 'Active' | 'Inactive' | 'Pending';
  verify?: boolean;
}) => {
  const temporaryPassword = payload.password || generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const notary = new NotaryUser({
    ...payload,
    specialty: payload.specialty || 'Mobile Loan Signing Agent',
    email: payload.email.trim().toLowerCase(),
    passwordHash,
    adminVisiblePasswordCipher: encryptVisiblePassword(temporaryPassword),
    passwordChangedBy: 'admin',
    passwordChangedAt: new Date(),
  });
  notary.publicId = buildNotaryPublicId(notary);
  await notary.save();

  const serialized = serializeNotaryUser(notary);

  if (payload.sendInvite) {
    await safelySendNotaryInviteEmail(serialized, temporaryPassword);
  }

  return serialized;
};

export const updateNotary = async (
  id: string,
  payload: Partial<{
    fullName: string;
    specialty?: string;
    email: string;
    phone: string;
    license: string;
    expiry?: string;
    serviceArea?: string;
    userName?: string;
    password?: string;
    sendInvite?: boolean;
    status: 'Active' | 'Inactive' | 'Pending';
    verify?: boolean;
  }>,
) => {
  const notary = await NotaryUser.findById(id);

  if (!notary) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Notary user not found');
  }

  if (payload.fullName !== undefined) notary.fullName = payload.fullName;
  if (payload.specialty !== undefined) notary.specialty = payload.specialty;
  if (payload.email !== undefined) notary.email = payload.email.trim().toLowerCase();
  if (payload.phone !== undefined) notary.phone = payload.phone;
  if (payload.license !== undefined) notary.license = payload.license;
  if (payload.expiry !== undefined) notary.expiry = payload.expiry;
  if (payload.serviceArea !== undefined) notary.serviceArea = payload.serviceArea;
  if (payload.userName !== undefined) notary.userName = payload.userName;
  if (payload.sendInvite !== undefined) notary.sendInvite = payload.sendInvite;
  if (payload.status !== undefined) notary.status = payload.status;
  if (payload.verify !== undefined) notary.verify = payload.verify;
  if (payload.password) {
    notary.passwordHash = await bcrypt.hash(payload.password, 12);
    notary.adminVisiblePasswordCipher = encryptVisiblePassword(payload.password);
    notary.passwordChangedBy = 'admin';
    notary.passwordChangedAt = new Date();
  }

  await notary.save();
  await ensureNotaryPublicId(notary);

  const serialized = serializeNotaryUser(notary);

  if (payload.sendInvite) {
    await safelySendNotaryInviteEmail(serialized, payload.password);
  }

  return serialized;
};

export const deleteNotary = async (id: string): Promise<void> => {
  const notary = await NotaryUser.findByIdAndDelete(id);
  if (!notary) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Notary user not found');
  }
};
