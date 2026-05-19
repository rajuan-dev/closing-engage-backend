import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../core/http-error';
import { verifyAdminToken, verifyAuthToken } from '../modules/auth/auth.service';

const getBearerToken = (req: Request): string => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Authorization token is required');
  }

  return authorization.slice('Bearer '.length).trim();
};

export const requireAdminAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = getBearerToken(req);
  const payload = verifyAdminToken(token);

  req.admin = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  req.auth = req.admin;

  next();
};

export const requireCompanyAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = getBearerToken(req);
  const payload = verifyAuthToken(token);

  if (payload.role !== 'company') {
    next(new HttpError(StatusCodes.FORBIDDEN, 'Company role is required'));
    return;
  }

  req.company = {
    id: payload.companyId ?? payload.sub,
    email: payload.email,
    role: payload.role,
    memberId: payload.memberId,
    memberRole: payload.memberRole,
    permissions: payload.permissions,
  };
  req.auth = req.company;

  next();
};

export const requireNotaryAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = getBearerToken(req);
  const payload = verifyAuthToken(token);

  if (payload.role !== 'notary') {
    next(new HttpError(StatusCodes.FORBIDDEN, 'Notary role is required'));
    return;
  }

  req.notary = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  req.auth = req.notary;

  next();
};

export const requireAnyAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = getBearerToken(req);
  const payload = verifyAuthToken(token);

  req.auth = {
    id: payload.role === 'company' ? payload.companyId ?? payload.sub : payload.sub,
    email: payload.email,
    role: payload.role,
    memberId: payload.memberId,
    memberRole: payload.memberRole,
    permissions: payload.permissions,
  };

  if (payload.role === 'admin') {
    req.admin = req.auth as Express.Request['admin'];
  }

  if (payload.role === 'company') {
    req.company = req.auth as Express.Request['company'];
  }

  if (payload.role === 'notary') {
    req.notary = req.auth as Express.Request['notary'];
  }

  next();
};
