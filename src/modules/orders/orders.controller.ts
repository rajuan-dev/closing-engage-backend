import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { HttpError } from '../../core/http-error';
import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { loanTypes, notaryPreferences, orderPriorities, orderStatuses } from './orders.model';
import {
  acceptOpenOrder,
  assignNotary,
  confirmOrderMeeting,
  confirmNotaryPrintedDocuments,
  createOrder,
  deleteOrder,
  getOrder,
  listOrderTimeline,
  listOrders,
  scheduleOrderMeeting,
  updateOrder,
  updateOrderStatus,
} from './orders.service';

const nonEmpty = z.string().trim().min(1);

const idParamsSchema = z.object({
  id: nonEmpty,
});

const listOrdersQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  search: z.string().trim().optional(),
});

const orderDocumentPayloadSchema = z
  .object({
    name: z.string().trim().optional(),
    fileName: z.string().trim().optional(),
    meta: z.string().trim().optional(),
    size: z.string().trim().optional(),
    fileSize: z.number().min(0).optional(),
    mimeType: z.string().trim().optional(),
  })
  .refine((document) => Boolean(document.name || document.fileName), {
    message: 'Document name or fileName is required',
    path: ['name'],
  });

const orderPayloadSchema = z.object({
  title: z.string().trim().optional(),
  titleCompany: z.string().trim().optional(),
  companyId: z.string().trim().optional(),
  clientName: z.string().trim().optional(),
  propertyAddress: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  signerName: z.string().trim().optional(),
  signerPhone: z.string().trim().optional(),
  signingDate: z.string().trim().optional(),
  signingTime: z.string().trim().optional(),
  date: z.string().trim().optional(),
  loanType: z.enum(loanTypes).optional(),
  scanbacksRequired: z.boolean().optional(),
  scanbacks: z.string().trim().optional(),
  status: z.enum(orderStatuses).optional(),
  priority: z.enum(orderPriorities).optional(),
  notaryPreference: z.enum(notaryPreferences).optional(),
  preferredNotary: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  specialInstructions: z.string().trim().optional(),
  notaryNotes: z.string().trim().optional(),
  documents: z.array(orderDocumentPayloadSchema).optional(),
});

const orderUpdatePayloadSchema = orderPayloadSchema.partial();

const statusPayloadSchema = z.object({
  status: z.enum(orderStatuses),
});

const meetingPayloadSchema = z.object({
  signingDate: nonEmpty,
  signingTime: nonEmpty,
});

const assignNotaryPayloadSchema = z
  .object({
    notaryName: z.string().trim().optional(),
    notaryId: z.string().trim().optional(),
    notaryEmail: z.string().trim().email().optional(),
    openForAll: z.boolean().optional(),
  })
  .superRefine((payload, ctx) => {
    if (!payload.openForAll && !payload.notaryName?.trim() && !payload.notaryId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Notary name or notaryId is required',
        path: ['notaryName'],
      });
    }
  });

const combineAddress = (payload: z.infer<typeof orderPayloadSchema>): string | undefined => {
  const propertyAddress = payload.propertyAddress?.trim();
  if (propertyAddress) return propertyAddress;

  const cityStateZip = [payload.city, payload.state, payload.zip].filter(Boolean).join(', ');
  return [payload.address, cityStateZip].filter(Boolean).join(', ') || undefined;
};

const scanbacksToBoolean = (value?: string): boolean | undefined => {
  if (!value) return undefined;
  return ['yes', 'true', 'required', 'scanbacks required'].includes(value.trim().toLowerCase());
};

const normalizeOrderPayload = (payload: z.infer<typeof orderPayloadSchema>) => {
  const propertyAddress = combineAddress(payload);
  const signingDate = payload.signingDate || payload.date;
  const preferredNotary = payload.preferredNotary?.trim();

  if (!propertyAddress) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Property address is required');
  }

  if (!signingDate) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Signing date is required');
  }

  return {
    ...payload,
    propertyAddress,
    signingDate,
    signingTime: payload.signingTime || 'TBD',
    scanbacksRequired: payload.scanbacksRequired ?? scanbacksToBoolean(payload.scanbacks) ?? false,
    status: payload.status ?? 'Received',
    priority: payload.priority ?? 'Standard',
    notaryPreference:
      payload.notaryPreference ??
      (preferredNotary && preferredNotary.toLowerCase() !== 'no preference' ? 'Manual assignment' : 'First available'),
    preferredNotaryName: preferredNotary && preferredNotary.toLowerCase() !== 'no preference' ? preferredNotary : undefined,
    instructions: payload.instructions ?? payload.specialInstructions,
    documents: payload.documents?.map((document) => ({
      name: document.name || document.fileName || 'Uploaded document',
      meta: document.meta || document.size || 'Uploaded with order',
      fileSize: document.fileSize,
      size: document.size,
      mimeType: document.mimeType,
    })),
  };
};

const normalizeOrderUpdatePayload = (payload: z.infer<typeof orderUpdatePayloadSchema>) => {
  const propertyAddress = combineAddress(payload as z.infer<typeof orderPayloadSchema>);
  const signingDate = payload.signingDate || payload.date;
  const preferredNotary = payload.preferredNotary?.trim();

  return {
    ...payload,
    ...(propertyAddress ? { propertyAddress } : {}),
    ...(signingDate ? { signingDate } : {}),
    ...(payload.signingTime ? { signingTime: payload.signingTime } : {}),
    ...(payload.scanbacksRequired !== undefined || payload.scanbacks
      ? { scanbacksRequired: payload.scanbacksRequired ?? scanbacksToBoolean(payload.scanbacks) ?? false }
      : {}),
    ...(preferredNotary
      ? {
          notaryPreference: (preferredNotary.toLowerCase() === 'no preference'
            ? 'First available'
            : 'Manual assignment') as (typeof notaryPreferences)[number],
          preferredNotaryName: preferredNotary.toLowerCase() === 'no preference' ? undefined : preferredNotary,
        }
      : {}),
    ...(payload.instructions || payload.specialInstructions
      ? { instructions: payload.instructions ?? payload.specialInstructions }
      : {}),
    ...(payload.documents
      ? {
          documents: payload.documents.map((document) => ({
            name: document.name || document.fileName || 'Uploaded document',
            meta: document.meta || document.size || 'Uploaded with order',
            fileSize: document.fileSize,
            size: document.size,
            mimeType: document.mimeType,
          })),
        }
      : {}),
  };
};

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const orders = await listOrders(req.auth!, query);

  return sendResponse(res, {
    success: true,
    message: 'Orders fetched successfully',
    data: orders,
  });
});

export const postOrder = asyncHandler(async (req: Request, res: Response) => {
  const payload = orderPayloadSchema.parse(req.body);
  const order = await createOrder(req.auth!, {
    ...normalizeOrderPayload(payload),
    titleCompany: payload.titleCompany || 'Closing Engage',
    createdByAdminId: req.admin?.id,
  });

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const order = await getOrder(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Order fetched successfully',
    data: order,
  });
});

export const patchOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = orderUpdatePayloadSchema.parse(req.body);
  const order = await updateOrder(req.auth!, id, normalizeOrderUpdatePayload(payload) as Parameters<typeof updateOrder>[2]);

  return sendResponse(res, {
    success: true,
    message: 'Order updated successfully',
    data: order,
  });
});

export const removeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  await deleteOrder(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Order deleted successfully',
  });
});

export const patchOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const { status } = statusPayloadSchema.parse(req.body);
  const order = await updateOrderStatus(req.auth!, id, status);

  return sendResponse(res, {
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
});

export const patchNotaryOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const { status } = statusPayloadSchema.parse(req.body);
  const order = await updateOrderStatus(req.auth!, id, status);

  return sendResponse(res, {
    success: true,
    message: 'Notary order status updated successfully',
    data: order,
  });
});

export const patchOrderAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = assignNotaryPayloadSchema.parse(req.body);
  const order = await assignNotary(req.auth!, id, payload);

  return sendResponse(res, {
    success: true,
    message: 'Order notary assignment updated successfully',
    data: order,
  });
});

export const patchAcceptOpenOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const order = await acceptOpenOrder(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Open order accepted successfully',
    data: order,
  });
});

export const patchOrderPrintedConfirmation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const order = await confirmNotaryPrintedDocuments(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Printed documents confirmed successfully',
    data: order,
  });
});

export const patchOrderMeeting = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = meetingPayloadSchema.parse(req.body);
  const order = await scheduleOrderMeeting(req.auth!, id, payload);

  return sendResponse(res, {
    success: true,
    message: 'Meeting scheduled successfully',
    data: order,
  });
});

export const patchOrderMeetingConfirmation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const order = await confirmOrderMeeting(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Meeting confirmed successfully',
    data: order,
  });
});

export const getOrderTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const timeline = await listOrderTimeline(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Order timeline fetched successfully',
    data: timeline,
  });
});
