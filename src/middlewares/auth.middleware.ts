import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../core/http-error';
import { verifyAdminToken } from '../modules/auth/auth.service';

export const requireAdminAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    next(new HttpError(StatusCodes.UNAUTHORIZED, 'Authorization token is required'));
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();
  const payload = verifyAdminToken(token);

  req.admin = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  next();
};
