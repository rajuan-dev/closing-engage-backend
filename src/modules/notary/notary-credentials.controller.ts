import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import {
  addNotaryCredential,
  getNotaryCredentials,
  updateNotaryCommission,
} from './notary-credentials.service';

const commissionSchema = z.object({
  licenseNumber: z.string().trim().optional(),
  commissionAuthority: z.string().trim().optional(),
  commissionExpiry: z.string().trim().optional(),
  eoCoverage: z.string().trim().optional(),
  backgroundScreeningStatus: z.enum(['Pending', 'Verified', 'Failed']).optional(),
  backgroundScreeningDetail: z.string().trim().optional(),
});

const credentialSchema = z.object({
  documentName: z.string().trim().min(1, 'Document name is required'),
  issuer: z.string().trim().min(1, 'Issuer is required'),
  verification: z.enum(['Auto-Verified', 'Manual Review']).optional(),
});

export const getCredentials = asyncHandler(async (req: Request, res: Response) => {
  const credentials = await getNotaryCredentials(req.notary!.id);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notary credentials retrieved successfully',
    data: credentials,
  });
});

export const updateCommission = asyncHandler(async (req: Request, res: Response) => {
  const updates = commissionSchema.parse(req.body);
  const credentials = await updateNotaryCommission(req.notary!.id, updates);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Primary commission details updated successfully',
    data: credentials,
  });
});

export const addCredential = asyncHandler(async (req: Request, res: Response) => {
  const input = credentialSchema.parse(req.body);
  const credentials = await addNotaryCredential(req.notary!.id, input);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Credential added to history successfully',
    data: credentials,
  });
});
