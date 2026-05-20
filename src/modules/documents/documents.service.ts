import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../core/http-error';
import { logger } from '../../core/logger';
import {
  buildDocumentS3Key,
  createGetSignedUrl,
  createPutSignedUrl,
  deleteS3ObjectSafely,
  getObjectBufferFromS3,
  uploadBufferToS3,
} from '../../utils/s3';
import { createNotificationSafely, notifyAdminsSafely } from '../notifications/notifications.service';
import { Order } from '../orders/orders.model';
import { CompanyUser } from '../user/company-user.model';
import { NotaryUser } from '../user/notary-user.model';
import { ClosingDocument, DocumentStatus, IClosingDocument, UploaderRole } from './documents.model';

type AuthContext = {
  id: string;
  email: string;
  role: 'admin' | 'company' | 'notary';
  memberId?: string;
  permissions?: {
    createOrders: boolean;
    viewOrders: boolean;
    downloadDocuments: boolean;
  };
};
type DocumentQuery = Record<string, unknown>;

type CreateDocumentPayload = {
  orderId?: string;
  orderNumber?: string;
  fileName: string;
  fileSize?: number;
  size?: string;
  mimeType?: string;
  uploadedByName?: string;
  uploaderRole?: UploaderRole;
  status?: DocumentStatus;
  comments?: string;
  s3Key?: string;
  requestUploadUrl?: boolean;
};

type UpdateStatusPayload = {
  status: DocumentStatus;
  comments?: string;
};

type AddVersionPayload = {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  s3Key?: string;
  requestUploadUrl?: boolean;
};

type UploadDocumentBinaryPayload = {
  orderId?: string;
  orderNumber?: string;
  fileName: string;
  fileSize?: number;
  size?: string;
  mimeType?: string;
  uploadedByName?: string;
  uploaderRole?: UploaderRole;
  status?: DocumentStatus;
  comments?: string;
};

const readableDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const sizeLabelFromBytes = (size?: number, fallback?: string): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!size) return '0 MB';
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const normalizeOrderNumber = (value?: string): string => {
  const clean = value?.trim();
  if (!clean) return 'UNASSIGNED';
  return clean.startsWith('#') ? clean : `#${clean}`;
};

const orderLookupQuery = (id: string) => {
  const normalized = id.trim();
  const withHash = normalized.startsWith('#') ? normalized : `#${normalized}`;
  const withoutHash = normalized.replace(/^#/, '');

  if (Types.ObjectId.isValid(normalized)) {
    return { _id: normalized };
  }

  return { orderNumber: { $in: [normalized, withHash, withoutHash] } };
};

const assertOrderScope = async (auth: AuthContext, orderIdentifier?: string) => {
  if (!orderIdentifier) return null;

  const order = await Order.findOne(orderLookupQuery(orderIdentifier));
  if (!order) return null;

  if (auth.role === 'company' && order.companyId?.toString() !== auth.id) {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Document order is outside company scope');
  }

  if (auth.role === 'notary' && order.assignedNotaryId?.toString() !== auth.id) {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Document order is outside notary assignment scope');
  }

  return order;
};

const documentScopeQuery = async (auth: AuthContext): Promise<DocumentQuery> => {
  if (auth.role === 'admin') return {};

  if (auth.role === 'company') {
    const companyOrders = await Order.find({ companyId: auth.id }).select('_id orderNumber');
    const companyOrderIds = companyOrders.map((order) => order._id);
    const companyOrderNumbers = companyOrders.map((order) => order.orderNumber);

    return {
      $and: [
        {
          $or: [{ uploadedBy: auth.id }, { orderId: { $in: companyOrderIds } }, { orderNumber: { $in: companyOrderNumbers } }],
        },
        {
          $or: [
            { uploaderRole: { $ne: 'notary' } },
            { status: { $in: ['Approved', 'Verified'] } },
          ],
        },
      ],
    };
  }

  const notaryOrders = await Order.find({ assignedNotaryId: auth.id }).select('_id orderNumber');
  return {
    $or: [
      { uploadedBy: auth.id },
      { orderId: { $in: notaryOrders.map((order) => order._id) } },
      { orderNumber: { $in: notaryOrders.map((order) => order.orderNumber) } },
    ],
  };
};

const findDocument = async (auth: AuthContext, id: string): Promise<IClosingDocument> => {
  const scope = await documentScopeQuery(auth);
  const document = await ClosingDocument.findOne({ ...scope, _id: id });

  if (!document) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Document not found');
  }

  return document;
};

const assertCompanyPermission = (
  auth: AuthContext,
  permission: 'createOrders' | 'viewOrders' | 'downloadDocuments',
  message: string,
) => {
  if (auth.role !== 'company' || !auth.memberId) return;

  if (!auth.permissions?.[permission]) {
    throw new HttpError(StatusCodes.FORBIDDEN, message);
  }
};

const uploadedByFor = async (auth: AuthContext, provided?: string): Promise<string> => {
  if (provided?.trim()) return provided.trim();

  if (auth.role === 'company') {
    const company = await CompanyUser.findById(auth.id);
    return company?.companyName || auth.email;
  }

  if (auth.role === 'notary') {
    const notary = await NotaryUser.findById(auth.id);
    return notary?.fullName || auth.email;
  }

  return 'Closing Engage Admin';
};

const uploaderRoleFor = (auth: AuthContext, provided?: UploaderRole): UploaderRole => {
  if (auth.role !== 'admin') return auth.role;
  return provided ?? 'admin';
};

const toAdminStatus = (status: DocumentStatus): 'Approved' | 'Rejected' | 'Pending' => {
  if (status === 'Approved' || status === 'Verified') return 'Approved';
  if (status === 'Rejected') return 'Rejected';
  return 'Pending';
};

const toPortalStatus = (status: DocumentStatus): 'Approved' | 'Submitted' | 'Pending' | 'Verified' | 'Rejected' => {
  if (status === 'Approved') return 'Approved';
  if (status === 'Verified') return 'Verified';
  if (status === 'Rejected') return 'Rejected';
  if (status === 'Submitted') return 'Submitted';
  return 'Pending';
};

export const serializeDocumentRow = (document: IClosingDocument): [string, string, string, string, string, string] => [
  document.fileName,
  document.orderNumber,
  document.uploadedByName.toUpperCase(),
  readableDate(document.createdAt),
  sizeLabelFromBytes(document.fileSize, document.sizeLabel),
  toAdminStatus(document.status),
];

export const serializeDocumentRecord = (document: IClosingDocument) => ({
  id: document._id.toString(),
  name: document.fileName,
  orderId: document.orderNumber.replace(/^#/, ''),
  uploadDate: readableDate(document.createdAt),
  size: sizeLabelFromBytes(document.fileSize, document.sizeLabel),
  status: toPortalStatus(document.status),
  uploadedBy: document.uploadedByName,
  uploaderRole: document.uploaderRole,
});

export const serializeDocumentDetail = (document: IClosingDocument) => ({
  id: document._id.toString(),
  fileName: document.fileName,
  name: document.fileName,
  orderId: document.orderNumber.replace(/^#/, ''),
  orderNumber: document.orderNumber,
  uploadDate: readableDate(document.createdAt),
  uploadedAt: document.createdAt.toISOString(),
  size: sizeLabelFromBytes(document.fileSize, document.sizeLabel),
  fileSize: document.fileSize,
  mimeType: document.mimeType,
  status: document.status,
  displayStatus: toPortalStatus(document.status),
  uploadedBy: document.uploadedByName,
  uploaderRole: document.uploaderRole,
  comments: document.comments ?? '',
  isLocked: document.isLocked,
  s3Key: document.s3Key,
  versions: document.versions.map((version) => ({
    versionId: version.versionId,
    fileName: version.fileName,
    fileSize: version.fileSize,
    size: sizeLabelFromBytes(version.fileSize),
    mimeType: version.mimeType,
    uploadedAt: version.uploadedAt.toISOString(),
    uploaderRole: version.uploaderRole,
  })),
});

export const listDocuments = async (
  auth: AuthContext,
  filters: { status?: DocumentStatus; search?: string; shape?: 'admin' | 'portal' | 'detail' },
) => {
  assertCompanyPermission(auth, 'viewOrders', 'You do not have permission to view documents');
  const query = await documentScopeQuery(auth);

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const documents = await ClosingDocument.find(query).sort({ createdAt: -1 });
  if (filters.shape === 'detail') return documents.map(serializeDocumentDetail);
  if (filters.shape === 'portal' || auth.role !== 'admin') return documents.map(serializeDocumentRecord);
  return documents.map(serializeDocumentRow);
};

export const createDocument = async (auth: AuthContext, payload: CreateDocumentPayload) => {
  const orderIdentifier = payload.orderId || payload.orderNumber;
  const order = await assertOrderScope(auth, orderIdentifier);
  const uploaderRole = uploaderRoleFor(auth, payload.uploaderRole);
  const orderNumber = normalizeOrderNumber(order?.orderNumber || payload.orderNumber || payload.orderId);
  const s3Key =
    payload.s3Key ||
    buildDocumentS3Key({
      role: uploaderRole,
      orderId: orderNumber,
      ownerId: auth.id,
      fileName: payload.fileName,
    });

  const document = await ClosingDocument.create({
    orderId: order?._id,
    orderNumber,
    fileName: payload.fileName,
    fileSize: payload.fileSize ?? 0,
    sizeLabel: payload.size,
    mimeType: payload.mimeType || 'application/pdf',
    uploadedBy: auth.id,
    uploadedByName: await uploadedByFor(auth, payload.uploadedByName),
    uploaderRole,
    status: payload.status || (auth.role === 'notary' ? 'Submitted' : 'Pending Review'),
    comments: payload.comments,
    s3Key,
    versions: [
      {
        s3Key,
        versionId: 'V1',
        fileName: payload.fileName,
        fileSize: payload.fileSize ?? 0,
        mimeType: payload.mimeType || 'application/pdf',
        uploadedBy: new Types.ObjectId(auth.id),
        uploaderRole,
        uploadedAt: new Date(),
      },
    ],
  });

  if (order && auth.role === 'notary') {
    order.status = 'Under Review';
    order.documents.unshift({
      name: payload.fileName,
      meta: `${sizeLabelFromBytes(payload.fileSize, payload.size)} • Scanback submitted`,
      uploadedBy: 'Notary',
      uploadedAt: new Date(),
    });
    order.timeline.unshift({
      title: `Scanbacks submitted: ${payload.fileName}`,
      date: new Date(),
      tone: 'blue',
    });
    await order.save();

    void notifyAdminsSafely({
      title: 'Scanbacks Submitted',
      message: `Order ${order.orderNumber} is ready for document review.`,
      type: 'document',
      linkId: document._id.toString(),
    });
  }

  let uploadUrl: string | null = null;
  let uploadUrlError: string | undefined;
  if (payload.requestUploadUrl) {
    try {
      uploadUrl = await createPutSignedUrl({ key: s3Key, contentType: document.mimeType });
    } catch (error) {
      uploadUrlError = 'Upload URL could not be generated. Document metadata was saved.';
      logger.error({ err: error, documentId: document._id.toString(), s3Key }, 'S3 upload URL generation failed');
    }
  }

  return { document: serializeDocumentDetail(document), uploadUrl, uploadUrlError };
};

export const uploadDocumentBinary = async (auth: AuthContext, payload: UploadDocumentBinaryPayload, fileBuffer: Buffer) => {
  const orderIdentifier = payload.orderId || payload.orderNumber;
  const order = await assertOrderScope(auth, orderIdentifier);
  const uploaderRole = uploaderRoleFor(auth, payload.uploaderRole);
  const orderNumber = normalizeOrderNumber(order?.orderNumber || payload.orderNumber || payload.orderId);
  const s3Key = buildDocumentS3Key({
    role: uploaderRole,
    orderId: orderNumber,
    ownerId: auth.id,
    fileName: payload.fileName,
  });

  await uploadBufferToS3({
    key: s3Key,
    body: fileBuffer,
    contentType: payload.mimeType || 'application/octet-stream',
  });

  const document = await ClosingDocument.create({
    orderId: order?._id,
    orderNumber,
    fileName: payload.fileName,
    fileSize: payload.fileSize ?? fileBuffer.length,
    sizeLabel: payload.size,
    mimeType: payload.mimeType || 'application/octet-stream',
    uploadedBy: auth.id,
    uploadedByName: await uploadedByFor(auth, payload.uploadedByName),
    uploaderRole,
    status: payload.status || (auth.role === 'notary' ? 'Submitted' : 'Pending Review'),
    comments: payload.comments,
    s3Key,
    versions: [
      {
        s3Key,
        versionId: 'V1',
        fileName: payload.fileName,
        fileSize: payload.fileSize ?? fileBuffer.length,
        mimeType: payload.mimeType || 'application/octet-stream',
        uploadedBy: new Types.ObjectId(auth.id),
        uploaderRole,
        uploadedAt: new Date(),
      },
    ],
  });

  if (order && auth.role === 'notary') {
    order.status = 'Under Review';
    order.documents.unshift({
      name: payload.fileName,
      meta: `${sizeLabelFromBytes(payload.fileSize ?? fileBuffer.length, payload.size)} • Scanback submitted`,
      uploadedBy: 'Notary',
      uploadedAt: new Date(),
    });
    order.timeline.unshift({
      title: `Scanbacks submitted: ${payload.fileName}`,
      date: new Date(),
      tone: 'blue',
    });
    await order.save();

    void notifyAdminsSafely({
      title: 'Scanbacks Submitted',
      message: `Order ${order.orderNumber} is ready for document review.`,
      type: 'document',
      linkId: document._id.toString(),
    });
  }

  return serializeDocumentDetail(document);
};

export const getDocument = async (auth: AuthContext, id: string) => {
  assertCompanyPermission(auth, 'viewOrders', 'You do not have permission to view documents');
  const document = await findDocument(auth, id);
  return serializeDocumentDetail(document);
};

export const deleteDocument = async (auth: AuthContext, id: string) => {
  if (auth.role !== 'admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins can delete documents');
  }

  const document = await ClosingDocument.findByIdAndDelete(id);
  if (!document) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Document not found');
  }

  await deleteS3ObjectSafely(document.s3Key);
};

export const updateDocumentStatus = async (auth: AuthContext, id: string, payload: UpdateStatusPayload) => {
  if (auth.role !== 'admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins can review document status');
  }

  const document = await ClosingDocument.findById(id);
  if (!document) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Document not found');
  }

  document.status = payload.status;
  document.comments = payload.comments ?? document.comments;
  document.isLocked = payload.status === 'Approved' || payload.status === 'Verified';
  document.reviewedBy = new Types.ObjectId(auth.id);
  document.reviewedAt = new Date();
  await document.save();

  if ((payload.status === 'Approved' || payload.status === 'Verified') && document.orderId) {
    const order = await Order.findById(document.orderId).select('companyId orderNumber');
    if (order?.companyId) {
      void createNotificationSafely({
        recipientId: order.companyId,
        recipientRole: 'company',
        title: 'Document Approved',
        message: `${document.fileName} has been approved.`,
        type: 'document',
        linkId: document._id.toString(),
      });
    }
  }

  return serializeDocumentDetail(document);
};

export const resubmitDocument = async (auth: AuthContext, id: string) => {
  if (auth.role !== 'notary') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only notaries can resubmit scanbacks');
  }

  const document = await findDocument(auth, id);
  if (document.uploaderRole !== 'notary' || document.uploadedBy?.toString() !== auth.id) {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only your own scanback documents can be resubmitted');
  }

  if (document.status !== 'Rejected') {
    throw new HttpError(StatusCodes.CONFLICT, 'Only rejected scanbacks can be resubmitted');
  }

  document.status = 'Submitted';
  document.comments = undefined;
  document.isLocked = false;
  document.reviewedBy = undefined;
  document.reviewedAt = undefined;
  await document.save();

  if (document.orderId) {
    const order = await Order.findById(document.orderId);
    if (order) {
      order.status = 'Under Review';
      order.timeline.unshift({
        title: `Scanbacks resubmitted: ${document.fileName}`,
        date: new Date(),
        tone: 'blue',
      });
      await order.save();

      void notifyAdminsSafely({
        title: 'Scanbacks Resubmitted',
        message: `Order ${order.orderNumber} is ready for document review again.`,
        type: 'document',
        linkId: document._id.toString(),
      });
    }
  }

  return serializeDocumentDetail(document);
};

export const addDocumentVersion = async (auth: AuthContext, id: string, payload: AddVersionPayload) => {
  const document = await findDocument(auth, id);

  if (document.isLocked && auth.role !== 'admin') {
    throw new HttpError(StatusCodes.CONFLICT, 'Approved documents are locked and cannot receive new versions');
  }

  const fileName = payload.fileName || document.fileName;
  const mimeType = payload.mimeType || document.mimeType;
  const fileSize = payload.fileSize ?? document.fileSize;
  const s3Key =
    payload.s3Key ||
    buildDocumentS3Key({
      role: auth.role,
      orderId: document.orderNumber,
      ownerId: auth.id,
      fileName,
    });

  const versionId = `V${document.versions.length + 1}`;
  document.fileName = fileName;
  document.fileSize = fileSize;
  document.mimeType = mimeType;
  document.s3Key = s3Key;
  document.status = auth.role === 'admin' ? document.status : 'Pending Review';
  document.isLocked = false;
  document.versions.unshift({
    s3Key,
    versionId,
    fileName,
    fileSize,
    mimeType,
    uploadedBy: new Types.ObjectId(auth.id),
    uploaderRole: auth.role,
    uploadedAt: new Date(),
  });

  await document.save();

  let uploadUrl: string | null = null;
  let uploadUrlError: string | undefined;
  if (payload.requestUploadUrl) {
    try {
      uploadUrl = await createPutSignedUrl({ key: s3Key, contentType: mimeType });
    } catch (error) {
      uploadUrlError = 'Version metadata was saved, but upload URL could not be generated.';
      logger.error({ err: error, documentId: document._id.toString(), s3Key }, 'S3 version upload URL generation failed');
    }
  }

  return { document: serializeDocumentDetail(document), uploadUrl, uploadUrlError };
};

export const listDocumentVersions = async (auth: AuthContext, id: string) => {
  const document = await findDocument(auth, id);
  return serializeDocumentDetail(document).versions;
};

export const restoreDocumentVersion = async (auth: AuthContext, id: string, versionId: string) => {
  if (auth.role !== 'admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins can restore document versions');
  }

  const document = await ClosingDocument.findById(id);
  if (!document) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Document not found');
  }

  const version = document.versions.find((candidate) => candidate.versionId === versionId);
  if (!version) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Document version not found');
  }

  document.fileName = version.fileName;
  document.fileSize = version.fileSize;
  document.mimeType = version.mimeType;
  document.s3Key = version.s3Key;
  document.status = 'Pending Review';
  document.isLocked = false;
  await document.save();

  return serializeDocumentDetail(document);
};

export const getDocumentSignedUrl = async (auth: AuthContext, id: string, mode: 'download' | 'preview') => {
  if (mode === 'download') {
    assertCompanyPermission(auth, 'downloadDocuments', 'You do not have permission to download documents');
  } else {
    assertCompanyPermission(auth, 'viewOrders', 'You do not have permission to preview documents');
  }

  const document = await findDocument(auth, id);

  try {
    const url = await createGetSignedUrl({
      key: document.s3Key,
      responseContentDisposition: mode === 'download' ? `attachment; filename="${document.fileName}"` : 'inline',
      responseContentType: mode === 'preview' ? document.mimeType || 'application/pdf' : undefined,
    });

    return {
      url,
      expiresInSeconds: 900,
      fileName: document.fileName,
      mode,
    };
  } catch (error) {
    logger.error({ err: error, documentId: id, s3Key: document.s3Key, mode }, 'S3 signed read URL generation failed');
    throw new HttpError(StatusCodes.BAD_GATEWAY, 'Secure document URL could not be generated');
  }
};

export const getDocumentFile = async (auth: AuthContext, id: string, mode: 'download' | 'preview') => {
  if (mode === 'download') {
    assertCompanyPermission(auth, 'downloadDocuments', 'You do not have permission to download documents');
  } else {
    assertCompanyPermission(auth, 'viewOrders', 'You do not have permission to preview documents');
  }

  const document = await findDocument(auth, id);

  try {
    const file = await getObjectBufferFromS3({ key: document.s3Key });
    return {
      fileName: document.fileName,
      contentType: file.contentType || document.mimeType || 'application/octet-stream',
      contentLength: file.contentLength ?? file.body.length,
      body: file.body,
      disposition: mode === 'download' ? 'attachment' : 'inline',
    };
  } catch (error) {
    logger.error({ err: error, documentId: id, s3Key: document.s3Key, mode }, 'S3 stored document fetch failed');
    throw new HttpError(StatusCodes.NOT_FOUND, 'Stored document file was not found');
  }
};
