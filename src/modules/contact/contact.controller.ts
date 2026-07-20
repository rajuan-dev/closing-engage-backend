import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { submitContactMessage as submitContactMessageService } from './contact.service';

const contactMessageSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Valid email is required'),
  company: z.string().trim().min(1, 'Company is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  message: z.string().trim().min(1, 'Message is required'),
});

export const submitContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const payload = contactMessageSchema.parse(req.body);
  const result = await submitContactMessageService(payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Contact message sent successfully',
    data: result,
  });
});
