import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import { sendEmail } from '../email/email.service';
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

const initialsFrom = (value: string) => value.trim().slice(0, 2).toUpperCase();
const generateTemporaryPassword = (): string => crypto.randomBytes(9).toString('base64url');

const serializeCompanyUser = (company: ICompanyUser) => ({
  id: company._id.toString(),
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
  sendInvite: company.sendInvite ?? false,
  verify: company.verify ?? false,
});

const serializeNotaryUser = (notary: INotaryUser) => ({
  id: notary._id.toString(),
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
  sendInvite: notary.sendInvite ?? false,
  verify: notary.verify ?? false,
});

const sendCompanyInviteEmail = async (company: ReturnType<typeof serializeCompanyUser>, password?: string) => {
  const targetEmail = company.contactEmail || company.businessEmail;
  const loginUrl = `${env.WEBSITE_BASE_URL}/login`;

  await sendEmail({
    to: targetEmail,
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

  await sendEmail({
    to: notary.email,
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
    await sendCompanyInviteEmail(company, password);
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
  }
};

const safelySendNotaryInviteEmail = async (
  notary: ReturnType<typeof serializeNotaryUser>,
  password?: string,
): Promise<void> => {
  try {
    await sendNotaryInviteEmail(notary, password);
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
  }
};

export const listCompanies = async () => {
  const companies = await CompanyUser.find().sort({ createdAt: -1 });
  return companies.map(serializeCompanyUser);
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

  const company = await CompanyUser.create({
    ...payload,
    businessEmail: payload.businessEmail.trim().toLowerCase(),
    contactEmail: payload.contactEmail?.trim().toLowerCase(),
    passwordHash,
  });

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
  if (payload.password) company.passwordHash = await bcrypt.hash(payload.password, 12);

  await company.save();

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
  return notaries.map(serializeNotaryUser);
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

  const notary = await NotaryUser.create({
    ...payload,
    specialty: payload.specialty || 'Mobile Loan Signing Agent',
    email: payload.email.trim().toLowerCase(),
    passwordHash,
  });

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
  if (payload.password) notary.passwordHash = await bcrypt.hash(payload.password, 12);

  await notary.save();

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
