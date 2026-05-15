import { randomUUID } from 'crypto';

import { Request } from 'express';
import pinoHttp from 'pino-http';

import { logger } from '../core/logger';

export const requestLoggerMiddleware = pinoHttp({
  logger,
  genReqId: (req) => {
    const requestId = req.headers['x-request-id']?.toString() || randomUUID();
    (req as Request).requestId = requestId;
    return requestId;
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} completed with ${res.statusCode}`,
  customErrorMessage: (req, res, error) =>
    `${req.method} ${req.url} failed with ${res.statusCode}: ${error.message}`,
});
