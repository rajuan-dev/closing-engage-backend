import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { pushDevicePlatforms } from './push-devices.model';
import { registerPushDevice, unregisterPushDevice } from './push-devices.service';

const registerSchema = z.object({
  expoPushToken: z.string().trim().min(1, 'Expo push token is required'),
  platform: z.enum(pushDevicePlatforms),
  deviceName: z.string().trim().optional(),
  deviceModel: z.string().trim().optional(),
  appVersion: z.string().trim().optional(),
});

const unregisterSchema = z.object({
  expoPushToken: z.string().trim().min(1, 'Expo push token is required'),
});

export const postRegisterPushDevice = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const device = await registerPushDevice(req.auth!, payload);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Push device registered successfully',
    data: device,
  });
});

export const postUnregisterPushDevice = asyncHandler(async (req: Request, res: Response) => {
  const payload = unregisterSchema.parse(req.body);
  await unregisterPushDevice(req.auth!, payload.expoPushToken);

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Push device unregistered successfully',
    data: {},
  });
});
