import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { sendResponse } from '../core/response';

export const notFoundMiddleware = (req: Request, res: Response): Response => {
  return sendResponse(res, {
    statusCode: StatusCodes.NOT_FOUND,
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    error: {
      path: req.originalUrl,
      method: req.method,
    },
  });
};
