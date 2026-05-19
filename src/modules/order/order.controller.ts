import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { notaryPreferences, orderPriorities, orderStatuses } from './order.model';
import {
  assignNotary,
  createOrder,
  deleteOrder,
  getOrder,
  listOrderTimeline,
  listOrders,
  updateOrder,
  updateOrderStatus,
} from './order.service';

const nonEmpty = z.string().trim().min(1);

const idParamsSchema = z.object({
  id: nonEmpty,
});

const listOrdersQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  search: z.string().trim().optional(),
});

const orderPayloadSchema = z.object({
  titleCompany: nonEmpty,
  propertyAddress: nonEmpty,
  signerName: z.string().trim().optional(),
  signerPhone: z.string().trim().optional(),
  signingDate: nonEmpty,
  signingTime: nonEmpty,
  status: z.enum(orderStatuses).default('Received'),
  priority: z.enum(orderPriorities).default('Standard'),
  notaryPreference: z.enum(notaryPreferences).default('First available'),
  instructions: z.string().trim().optional(),
  documents: z
    .array(
      z.object({
        name: nonEmpty,
        meta: nonEmpty,
      }),
    )
    .optional(),
});

const orderUpdatePayloadSchema = orderPayloadSchema.partial();

const statusPayloadSchema = z.object({
  status: z.enum(orderStatuses),
});

const assignNotaryPayloadSchema = z.object({
  notaryName: nonEmpty,
  notaryId: z.string().trim().optional(),
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const orders = await listOrders(query);

  return sendResponse(res, {
    success: true,
    message: 'Orders fetched successfully',
    data: orders,
  });
});

export const postOrder = asyncHandler(async (req: Request, res: Response) => {
  const payload = orderPayloadSchema.parse(req.body);
  const order = await createOrder({ ...payload, createdByAdminId: req.admin?.id });

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const order = await getOrder(id);

  return sendResponse(res, {
    success: true,
    message: 'Order fetched successfully',
    data: order,
  });
});

export const patchOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = orderUpdatePayloadSchema.parse(req.body);
  const order = await updateOrder(id, payload);

  return sendResponse(res, {
    success: true,
    message: 'Order updated successfully',
    data: order,
  });
});

export const removeOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  await deleteOrder(id);

  return sendResponse(res, {
    success: true,
    message: 'Order deleted successfully',
  });
});

export const patchOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const { status } = statusPayloadSchema.parse(req.body);
  const order = await updateOrderStatus(id, status);

  return sendResponse(res, {
    success: true,
    message: 'Order status updated successfully',
    data: order,
  });
});

export const patchOrderAssignment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = assignNotaryPayloadSchema.parse(req.body);
  const order = await assignNotary(id, payload);

  return sendResponse(res, {
    success: true,
    message: 'Order notary assignment updated successfully',
    data: order,
  });
});

export const getOrderTimeline = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const timeline = await listOrderTimeline(id);

  return sendResponse(res, {
    success: true,
    message: 'Order timeline fetched successfully',
    data: timeline,
  });
});
