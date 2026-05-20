import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { HttpError } from '../../core/http-error';
import { sendResponse } from '../../core/response';
import { asyncHandler } from '../../utils/async-handler';
import { documentStatuses, uploaderRoles } from './documents.model';
import {
  addDocumentVersion,
  createDocument,
  deleteDocument,
  getDocument,
  getDocumentFile,
  getDocumentSignedUrl,
  listDocumentVersions,
  listDocuments,
  resubmitDocument,
  restoreDocumentVersion,
  uploadDocumentBinary,
  updateDocumentStatus,
} from './documents.service';

const nonEmpty = z.string().trim().min(1);

const idParamsSchema = z.object({
  id: nonEmpty,
});

const listQuerySchema = z.object({
  status: z.enum(documentStatuses).optional(),
  search: z.string().trim().optional(),
  shape: z.enum(['admin', 'portal', 'detail']).optional(),
  mode: z.enum(['preview', 'download']).optional(),
});

const documentPayloadSchema = z.object({
  orderId: z.string().trim().optional(),
  orderNumber: z.string().trim().optional(),
  fileName: nonEmpty,
  fileSize: z.number().min(0).optional(),
  size: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  uploadedByName: z.string().trim().optional(),
  uploaderRole: z.enum(uploaderRoles).optional(),
  status: z.enum(documentStatuses).optional(),
  comments: z.string().trim().optional(),
  s3Key: z.string().trim().optional(),
  requestUploadUrl: z.boolean().optional(),
});

const statusPayloadSchema = z.object({
  status: z.enum(documentStatuses),
  comments: z.string().trim().optional(),
});

const versionPayloadSchema = z.object({
  fileName: z.string().trim().optional(),
  fileSize: z.number().min(0).optional(),
  mimeType: z.string().trim().optional(),
  s3Key: z.string().trim().optional(),
  requestUploadUrl: z.boolean().optional(),
});

const uploadDocumentQuerySchema = z.object({
  orderId: z.string().trim().optional(),
  orderNumber: z.string().trim().optional(),
  fileName: nonEmpty,
  fileSize: z.coerce.number().min(0).optional(),
  size: z.string().trim().optional(),
  mimeType: z.string().trim().optional(),
  uploadedByName: z.string().trim().optional(),
  uploaderRole: z.enum(uploaderRoles).optional(),
  status: z.enum(documentStatuses).optional(),
  comments: z.string().trim().optional(),
});

const restoreVersionPayloadSchema = z.object({
  versionId: nonEmpty,
});

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const query = listQuerySchema.parse(req.query);
  const documents = await listDocuments(req.auth!, query);

  return sendResponse(res, {
    success: true,
    message: 'Documents fetched successfully',
    data: documents,
  });
});

export const postDocument = asyncHandler(async (req: Request, res: Response) => {
  const payload = documentPayloadSchema.parse(req.body);
  const document = await createDocument(req.auth!, payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Document metadata created successfully',
    data: document,
  });
});

export const postDocumentUpload = asyncHandler(async (req: Request, res: Response) => {
  const payload = uploadDocumentQuerySchema.parse(req.query);
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'Document upload body is required');
  }

  const document = await uploadDocumentBinary(req.auth!, payload, req.body);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Document uploaded successfully',
    data: document,
  });
});

export const getDocumentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const document = await getDocument(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Document fetched successfully',
    data: document,
  });
});

export const removeDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  await deleteDocument(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Document deleted successfully',
  });
});

export const patchDocumentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = statusPayloadSchema.parse(req.body);
  const document = await updateDocumentStatus(req.auth!, id, payload);

  return sendResponse(res, {
    success: true,
    message: 'Document status updated successfully',
    data: document,
  });
});

export const postResubmitDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const document = await resubmitDocument(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Document resubmitted successfully',
    data: document,
  });
});

export const postDocumentVersion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const payload = versionPayloadSchema.parse(req.body);
  const document = await addDocumentVersion(req.auth!, id, payload);

  return sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Document version added successfully',
    data: document,
  });
});

export const getDocumentVersions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const versions = await listDocumentVersions(req.auth!, id);

  return sendResponse(res, {
    success: true,
    message: 'Document versions fetched successfully',
    data: versions,
  });
});

export const postRestoreDocumentVersion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const { versionId } = restoreVersionPayloadSchema.parse(req.body);
  const document = await restoreDocumentVersion(req.auth!, id, versionId);

  return sendResponse(res, {
    success: true,
    message: 'Document version restored successfully',
    data: document,
  });
});

export const getDownloadUrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const result = await getDocumentSignedUrl(req.auth!, id, 'download');

  return sendResponse(res, {
    success: true,
    message: 'Document download URL generated successfully',
    data: result,
  });
});

export const getPreviewUrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const result = await getDocumentSignedUrl(req.auth!, id, 'preview');

  return sendResponse(res, {
    success: true,
    message: 'Document preview URL generated successfully',
    data: result,
  });
});

export const getDocumentContent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamsSchema.parse(req.params);
  const { mode } = listQuerySchema.parse(req.query);
  const result = await getDocumentFile(req.auth!, id, mode || 'preview');

  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Length', String(result.contentLength));
  res.setHeader('Content-Disposition', `${result.disposition}; filename="${result.fileName}"`);
  res.send(result.body);
});
