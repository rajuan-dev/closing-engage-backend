import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { logger } from './logger';
import { HttpError } from './http-error';

interface ErrorPayload {
  statusCode: number;
  message: string;
  error?: unknown;
}

export const handleError = (error: unknown): ErrorPayload => {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      error: error.details,
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Validation failed',
      error: error.flatten(),
    };
  }

  logger.error({ err: error }, 'Unhandled application error');

  return {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error:
      env.NODE_ENV === 'production'
        ? undefined
        : error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
  };
};
