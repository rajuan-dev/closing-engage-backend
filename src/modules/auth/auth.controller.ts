import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import {
  getAdminById,
  getCompanyById,
  getCompanyMemberSession,
  getNotaryById,
  loginAdmin,
  loginCompany,
  loginNotary,
  loginPortalUser,
  requestPasswordReset,
  resetPasswordWithOtp,
  updateAdminPassword,
  updateAdminProfile,
  updateCompanyPassword,
  updateCompanyProfile,
  updateNotaryPassword,
  updateNotaryProfile,
  verifyPasswordResetOtp,
} from './auth.service';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().trim().min(1, 'Password is required'),
});

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
  companyName: z.string().trim().min(1, 'Company name is required'),
  companyEmail: z.string().trim().email('Valid company email is required'),
  contactNumber: z.string().trim().min(1, 'Contact number is required'),
  businessAddress: z.string().trim().min(1, 'Business address is required'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().trim().min(1, 'Current password is required'),
    newPassword: z.string().trim().min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z.string().trim().min(8, 'Confirm password must be at least 8 characters long'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

const resetRoleSchema = z.enum(['admin', 'company', 'notary']);

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  role: resetRoleSchema.optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  role: resetRoleSchema.optional(),
  otp: z.string().trim().regex(/^\d{6}$/, 'Six-digit verification code is required'),
});

const resetPasswordSchema = verifyOtpSchema
  .extend({
    newPassword: z.string().trim().min(8, 'New password must be at least 8 characters long'),
    confirmPassword: z.string().trim().min(8, 'Confirm password must be at least 8 characters long'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

const companyProfileSchema = z.object({
  contactPerson: z.string().trim().min(1).optional(),
  businessEmail: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  companyName: z.string().trim().min(1).optional(),
  contactEmail: z.string().trim().email().optional(),
  address: z.string().trim().optional(),
  avatarUrl: z.string().trim().optional(),
});

const notaryProfileSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  specialty: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  license: z.string().trim().min(1).optional(),
  expiry: z.string().trim().optional(),
  serviceArea: z.string().trim().optional(),
  avatarUrl: z.string().trim().optional(),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginAdmin(email, password);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin login successful',
    data: result,
  });
});

export const loginCompanyUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginCompany(email, password);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Company login successful',
    data: result,
  });
});

export const loginNotaryUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginNotary(email, password);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notary login successful',
    data: result,
  });
});

export const loginPortal = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginPortalUser(email, password);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Portal login successful',
    data: result,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const admin = await getAdminById(req.admin!.id);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin session is valid',
    data: { admin },
  });
});

export const companyMe = asyncHandler(async (req: Request, res: Response) => {
  const company = req.company!.memberId
    ? await getCompanyMemberSession(req.company!.memberId)
    : await getCompanyById(req.company!.id);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Company session is valid',
    data: { company },
  });
});

export const notaryMe = asyncHandler(async (req: Request, res: Response) => {
  const notary = await getNotaryById(req.notary!.id);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notary session is valid',
    data: { notary },
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const updates = profileSchema.parse(req.body);
  const admin = await updateAdminProfile(req.admin!.id, updates);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin profile updated successfully',
    data: { admin },
  });
});

export const updateCompanyAccountProfile = asyncHandler(async (req: Request, res: Response) => {
  const updates = companyProfileSchema.parse(req.body);
  const company = await updateCompanyProfile(req.company!.id, updates);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Company profile updated successfully',
    data: { company },
  });
});

export const updateNotaryAccountProfile = asyncHandler(async (req: Request, res: Response) => {
  const updates = notaryProfileSchema.parse(req.body);
  const notary = await updateNotaryProfile(req.notary!.id, updates);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notary profile updated successfully',
    data: { notary },
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = passwordSchema.parse(req.body);
  await updateAdminPassword(req.admin!.id, currentPassword, newPassword);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin password updated successfully',
  });
});

export const changeCompanyPassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = passwordSchema.parse(req.body);
  await updateCompanyPassword(req.company!.id, currentPassword, newPassword);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Company password updated successfully',
  });
});

export const changeNotaryPassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = passwordSchema.parse(req.body);
  await updateNotaryPassword(req.notary!.id, currentPassword, newPassword);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notary password updated successfully',
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, role } = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(email, role);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'If an account exists for this email, a verification code has been sent',
  });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, role, otp } = verifyOtpSchema.parse(req.body);
  await verifyPasswordResetOtp(email, otp, role);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Verification code confirmed',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, role, otp, newPassword } = resetPasswordSchema.parse(req.body);
  await resetPasswordWithOtp(email, otp, newPassword, role);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successfully',
  });
});
