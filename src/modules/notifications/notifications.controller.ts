import { Request, Response } from 'express';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from './notifications.service';

const idParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await listNotifications(req.auth!);

  return sendResponse(res, {
    success: true,
    message: 'Notifications fetched successfully',
    data: notifications,
  });
});

export const patchNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const notification = await markNotificationRead(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Notification marked as read',
    data: notification,
  });
});

export const patchAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await markAllNotificationsRead(req.auth!);

  return sendResponse(res, {
    success: true,
    message: 'All notifications marked as read',
  });
});
