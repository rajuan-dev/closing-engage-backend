import { NextFunction, Request, Response } from 'express';

import { handleError } from '../core/error-handler';
import { sendResponse } from '../core/response';

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  void next;
  const formattedError = handleError(error);

  return sendResponse(res, {
    statusCode: formattedError.statusCode,
    success: false,
    message: formattedError.message,
    error: formattedError.error,
  });
};
