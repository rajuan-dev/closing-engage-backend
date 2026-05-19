import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import {
  createCompany,
  createNotary,
  deleteCompany,
  deleteNotary,
  listCompanies,
  listNotaries,
  updateCompany,
  updateNotary,
} from './user.service';

const companySchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  businessEmail: z.string().trim().email('Valid business email is required'),
  phone: z.string().trim().default(''),
  contactPerson: z.string().trim().min(1, 'Contact person is required'),
  address: z.string().trim().optional(),
  contactEmail: z.string().trim().optional(),
  userName: z.string().trim().optional(),
  password: z.string().trim().optional(),
  sendInvite: z.boolean().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']),
  verify: z.boolean().optional(),
});

const companyUpdateSchema = companySchema.partial();

const notarySchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  specialty: z.string().trim().optional(),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().default(''),
  license: z.string().trim().min(1, 'License is required'),
  expiry: z.string().trim().optional(),
  serviceArea: z.string().trim().optional(),
  userName: z.string().trim().optional(),
  password: z.string().trim().optional(),
  sendInvite: z.boolean().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']),
  verify: z.boolean().optional(),
});

const notaryUpdateSchema = notarySchema.partial();

export const getCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const companies = await listCompanies();

  return sendResponse(res, {
    success: true,
    message: 'Companies fetched successfully',
    data: companies,
  });
});

export const postCompany = asyncHandler(async (req: Request, res: Response) => {
  const payload = companySchema.parse(req.body);
  const company = await createCompany(payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Company user created successfully',
    data: company,
  });
});

export const patchCompany = asyncHandler(async (req: Request, res: Response) => {
  const payload = companyUpdateSchema.parse(req.body);
  const company = await updateCompany(String(req.params.id), payload);

  return sendResponse(res, {
    success: true,
    message: 'Company user updated successfully',
    data: company,
  });
});

export const removeCompany = asyncHandler(async (req: Request, res: Response) => {
  await deleteCompany(String(req.params.id));

  return sendResponse(res, {
    success: true,
    message: 'Company user deleted successfully',
  });
});

export const getNotaries = asyncHandler(async (_req: Request, res: Response) => {
  const notaries = await listNotaries();

  return sendResponse(res, {
    success: true,
    message: 'Notaries fetched successfully',
    data: notaries,
  });
});

export const postNotary = asyncHandler(async (req: Request, res: Response) => {
  const payload = notarySchema.parse(req.body);
  const notary = await createNotary(payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Notary user created successfully',
    data: notary,
  });
});

export const patchNotary = asyncHandler(async (req: Request, res: Response) => {
  const payload = notaryUpdateSchema.parse(req.body);
  const notary = await updateNotary(String(req.params.id), payload);

  return sendResponse(res, {
    success: true,
    message: 'Notary user updated successfully',
    data: notary,
  });
});

export const removeNotary = asyncHandler(async (req: Request, res: Response) => {
  await deleteNotary(String(req.params.id));

  return sendResponse(res, {
    success: true,
    message: 'Notary user deleted successfully',
  });
});
