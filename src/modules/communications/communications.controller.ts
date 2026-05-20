import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import {
  getOrCreateThreadForOrder,
  getThreadMessages,
  listThreads,
  sendMessage,
} from './communications.service';
import { emitCommunicationMessage } from './communications.socket';

const orderParamsSchema = z.object({
  orderNumber: z.string().trim().min(1),
});

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const getThreads = asyncHandler(async (req: Request, res: Response) => {
  const threads = await listThreads(req.auth!);

  return sendResponse(res, {
    success: true,
    message: 'Communication threads fetched successfully',
    data: threads,
  });
});

export const getOrderThread = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber } = orderParamsSchema.parse(req.params);
  const thread = await getOrCreateThreadForOrder(req.auth!, orderNumber);

  return sendResponse(res, {
    success: true,
    message: 'Communication thread fetched successfully',
    data: thread,
  });
});

export const getOrderMessages = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber } = orderParamsSchema.parse(req.params);
  const thread = await getThreadMessages(req.auth!, orderNumber);

  return sendResponse(res, {
    success: true,
    message: 'Communication messages fetched successfully',
    data: thread,
  });
});

export const postOrderMessage = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber } = orderParamsSchema.parse(req.params);
  const payload = sendMessageSchema.parse(req.body);
  const result = await sendMessage(req.auth!, { orderNumber, body: payload.body });
  emitCommunicationMessage(result);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Communication message sent successfully',
    data: result,
  });
});
