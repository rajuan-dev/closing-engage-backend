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

const isMongoDuplicateKeyError = (
  error: unknown,
): error is Error & { code: number; keyPattern?: Record<string, number>; keyValue?: Record<string, unknown> } =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 11000;

const duplicateFieldMessage = (field: string, value?: unknown): string => {
  if (field === 'businessEmail') {
    return `Business email already exists${typeof value === 'string' ? `: ${value}` : ''}`;
  }

  if (field === 'contactEmail') {
    return `Contact email already exists${typeof value === 'string' ? `: ${value}` : ''}`;
  }

  if (field === 'userName') {
    return `Username already exists${typeof value === 'string' ? `: ${value}` : ''}`;
  }

  if (field === 'email') {
    return `Email already exists${typeof value === 'string' ? `: ${value}` : ''}`;
  }

  if (field === 'publicId') {
    return 'Generated public ID already exists. Please try again.';
  }

  return `${field} already exists${typeof value === 'string' ? `: ${value}` : ''}`;
};

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

  if (isMongoDuplicateKeyError(error)) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? Object.keys(error.keyValue ?? {})[0] ?? 'Record';
    const value = error.keyValue?.[field];

    return {
      statusCode: StatusCodes.CONFLICT,
      message: duplicateFieldMessage(field, value),
      error: env.NODE_ENV === 'production' ? undefined : { keyPattern: error.keyPattern, keyValue: error.keyValue },
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
