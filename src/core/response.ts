import { Response } from 'express';

interface ResponseOptions<T> {
  statusCode?: number;
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}

export const sendResponse = <T>(
  res: Response,
  { statusCode = 200, success, message, data, error }: ResponseOptions<T>,
): Response => {
  return res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(error !== undefined ? { error } : {}),
  });
};
