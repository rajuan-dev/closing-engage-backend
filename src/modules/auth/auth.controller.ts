import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { getAdminById, loginAdmin, updateAdminPassword, updateAdminProfile } from './auth.service';

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
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

export const me = asyncHandler(async (req: Request, res: Response) => {
  const admin = await getAdminById(req.admin!.id);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin session is valid',
    data: { admin },
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

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = passwordSchema.parse(req.body);
  await updateAdminPassword(req.admin!.id, currentPassword, newPassword);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin password updated successfully',
  });
});
