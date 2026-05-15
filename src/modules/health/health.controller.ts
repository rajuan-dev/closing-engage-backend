import { Request, Response } from 'express';

import { sendResponse } from '../../core/response';

export const getHealthStatus = (_req: Request, res: Response): Response => {
  return sendResponse(res, {
    success: true,
    message: 'Closing Engage Backend is running',
    data: {
      service: 'closing-engage-backend',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
};
