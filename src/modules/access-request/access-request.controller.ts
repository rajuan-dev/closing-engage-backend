import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import {
  createAccessRequest,
  listAccessRequests,
  updateAccessRequestStatus,
} from './access-request.service';

const companyRequestSchema = z.object({
  role: z.literal('company'),
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().default('N/A'),
  companyName: z.string().trim().min(1).default('Independent Escrow LLC'),
  contactType: z.string().trim().default('Title Company'),
  requestType: z.string().trim().default('Access Request'),
  coverageArea: z.string().trim().min(1).default('N/A'),
  message: z.string().trim().default('No additional comments.'),
});

const notaryRequestSchema = z.object({
  role: z.literal('notary'),
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().default('N/A'),
  commissionNumber: z.string().trim().default('N/A'),
  commissionExpiration: z.string().trim().default('N/A'),
  eoInsurance: z.string().trim().default('N/A'),
  certifications: z.string().trim().default('N/A'),
  coverageArea: z.string().trim().min(1).default('N/A'),
  message: z.string().trim().default('No additional comments.'),
});

const statusSchema = z.object({
  status: z.enum(['Pending', 'Approved', 'Declined']),
});

export const submitCompanyAccessRequest = asyncHandler(async (req: Request, res: Response) => {
  const payload = companyRequestSchema.parse(req.body);
  const request = await createAccessRequest(payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Company access request submitted successfully',
    data: request,
  });
});

export const submitNotaryAccessRequest = asyncHandler(async (req: Request, res: Response) => {
  const payload = notaryRequestSchema.parse(req.body);
  const request = await createAccessRequest(payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Notary access request submitted successfully',
    data: request,
  });
});

export const getAccessRequests = asyncHandler(async (_req: Request, res: Response) => {
  const requests = await listAccessRequests();

  return sendResponse(res, {
    success: true,
    message: 'Access requests fetched successfully',
    data: requests,
  });
});

export const patchAccessRequestStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = statusSchema.parse(req.body);
  const request = await updateAccessRequestStatus(String(req.params.id), status);

  return sendResponse(res, {
    success: true,
    message: 'Access request status updated successfully',
    data: request,
  });
});
