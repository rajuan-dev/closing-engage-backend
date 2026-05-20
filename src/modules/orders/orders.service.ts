import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../core/http-error';
import { buildDocumentS3Key } from '../../utils/s3';
import { ClosingDocument } from '../documents/documents.model';
import { createNotificationSafely, notifyAdminsSafely } from '../notifications/notifications.service';
import { CompanyUser } from '../user/company-user.model';
import { NotaryUser } from '../user/notary-user.model';
import { IOrder, IOrderDocument, IOrderMeeting, LoanType, NotaryPreference, Order, OrderPriority, OrderStatus } from './orders.model';

type OrderRow = [string, string, string, string, string, string, OrderStatus, 'none' | 'jane' | 'mark'];
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

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const initialsFrom = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || value.trim().slice(0, 2).toUpperCase();

const generateOrderNumber = (): string => `#ORD-${Math.floor(10000 + Math.random() * 90000)}`;

const normalizeAddress = (address: string): string => address.replace(/,\s*/g, '\n');

const displayDateTime = (order: IOrder): string => {
  const date = order.signingDate.trim();
  const time = order.signingTime.trim();
  return time ? `${date}\n${time}` : date;
};

const timelineDate = (date: Date): string =>
  date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const avatarForNotary = (name: string): 'jane' | 'mark' =>
  name.toLowerCase().includes('sarah') || name.toLowerCase().includes('elena') ? 'jane' : 'mark';

const sizeLabelFromBytes = (size?: number, fallback?: string): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!size) return '0 MB';
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const pushTimeline = (order: IOrder, title: string, tone: 'blue' | 'slate' | 'green' | 'red' = 'blue'): void => {
  order.timeline.unshift({ title, date: new Date(), tone });
};

const serializeMeeting = (meeting?: IOrderMeeting | null) =>
  meeting
    ? {
        status: meeting.status,
        date: meeting.date,
        time: meeting.time,
        scheduledByRole: meeting.scheduledByRole,
        scheduledAt: meeting.scheduledAt.toISOString(),
        confirmedByRole: meeting.confirmedByRole,
        confirmedAt: meeting.confirmedAt?.toISOString(),
      }
    : null;

const orderLookupQuery = (id: string) => {
  const normalized = id.trim();
  const withHash = normalized.startsWith('#') ? normalized : `#${normalized}`;
  const withoutHash = normalized.replace(/^#/, '');

  if (Types.ObjectId.isValid(normalized)) {
    return { _id: normalized };
  }

  return { orderNumber: { $in: [normalized, withHash, withoutHash] } };
};

const scopedQuery = (auth: AuthContext, base: Record<string, unknown> = {}) => {
  if (auth.role === 'admin') return base;
  if (auth.role === 'company') return { ...base, companyId: auth.id };
  return { ...base, assignedNotaryId: auth.id };
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

const findOrder = async (id: string, auth: AuthContext): Promise<IOrder> => {
  assertCompanyPermission(auth, 'viewOrders', 'You do not have permission to view orders');
  const order = await Order.findOne(scopedQuery(auth, orderLookupQuery(id)));

  if (!order) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  return order;
};

export const serializeOrderRow = (order: IOrder): OrderRow => [
  order.orderNumber,
  order.titleCompany,
  order.companyInitials,
  order.assignedNotaryName,
  normalizeAddress(order.propertyAddress),
  displayDateTime(order),
  order.status,
  order.avatarKey,
];

export const serializeOrderDetail = (order: IOrder) => ({
  id: order.orderNumber,
  row: serializeOrderRow(order),
  title: order.title ?? '',
  titleCompany: order.titleCompany,
  companyInitials: order.companyInitials,
  companyId: order.companyId?.toString() ?? '',
  clientName: order.clientName || order.signerName || '',
  signerName: order.signerName ?? '',
  signerPhone: order.signerPhone ?? '',
  propertyAddress: order.propertyAddress,
  location: order.propertyAddress,
  signingDate: order.signingDate,
  date: order.signingDate,
  signingTime: order.signingTime,
  time: order.signingTime,
  loanType: order.loanType ?? '',
  scanbacksRequired: order.scanbacksRequired,
  status: order.status,
  priority: order.priority,
  notaryPreference: order.notaryPreference,
  preferredNotaryName: order.preferredNotaryName ?? '',
  notary: order.assignedNotaryName === 'Unassigned' ? '--' : order.assignedNotaryName,
  assignedNotaryName: order.assignedNotaryName,
  assignedNotaryId: order.assignedNotaryId?.toString() ?? '',
  avatarKey: order.avatarKey,
  specialInstructions: order.specialInstructions ?? '',
  notaryNotes: order.notaryNotes ?? '',
  notaryPrintedConfirmed: order.notaryPrintedConfirmed ?? false,
  meeting: serializeMeeting(order.meeting),
  documents: order.documents.map((document) => ({
    name: document.name,
    meta: document.meta,
    uploadedBy: document.uploadedBy,
    uploadedAt: document.uploadedAt.toISOString(),
  })),
  timeline: order.timeline.map((event) => ({
    title: event.title,
    date: timelineDate(event.date),
    tone: event.tone,
  })),
  createdDate: formatDate(order.createdAt),
});

const serializePortalOrder = (order: IOrder) => ({
  id: order.orderNumber,
  clientName: order.clientName || order.signerName || '',
  propertyAddress: order.propertyAddress,
  location: order.propertyAddress,
  notary: order.assignedNotaryName === 'Unassigned' ? '--' : order.assignedNotaryName,
  status: order.status,
  date: order.signingDate,
  time: order.signingTime,
  loanType: order.loanType ?? '',
  scanbacksRequired: order.scanbacksRequired,
  preferredNotaryName: order.preferredNotaryName ?? '',
  notaryPrintedConfirmed: order.notaryPrintedConfirmed ?? false,
  meeting: serializeMeeting(order.meeting),
});

export const listOrders = async (auth: AuthContext, filters: { status?: OrderStatus; search?: string }) => {
  assertCompanyPermission(auth, 'viewOrders', 'You do not have permission to view orders');
  const query: Record<string, unknown> = scopedQuery(auth);

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const orders = await Order.find(query).sort({ createdAt: -1 });
  return auth.role === 'admin' ? orders.map(serializeOrderRow) : orders.map(serializePortalOrder);
};

type OrderDocumentInput = Pick<IOrderDocument, 'name' | 'meta'> & {
  fileSize?: number;
  size?: string;
  mimeType?: string;
};

export const createOrder = async (auth: AuthContext, payload: {
  title?: string;
  titleCompany: string;
  companyId?: string;
  clientName?: string;
  propertyAddress: string;
  signerName?: string;
  signerPhone?: string;
  signingDate: string;
  signingTime: string;
  loanType?: LoanType;
  scanbacksRequired?: boolean;
  status: OrderStatus;
  priority: OrderPriority;
  notaryPreference: NotaryPreference;
  preferredNotaryName?: string;
  instructions?: string;
  documents?: OrderDocumentInput[];
  createdByAdminId?: string;
}) => {
  if (auth.role === 'notary') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Notaries cannot create orders');
  }

  assertCompanyPermission(auth, 'createOrders', 'You do not have permission to create orders');

  let orderNumber = generateOrderNumber();
  while (await Order.exists({ orderNumber })) {
    orderNumber = generateOrderNumber();
  }

  let titleCompany = payload.titleCompany;
  let companyInitials = initialsFrom(payload.titleCompany);
  let companyId = payload.companyId;

  if (auth.role === 'company') {
    const company = await CompanyUser.findById(auth.id);
    if (!company || company.status === 'Inactive') {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Company account not found');
    }
    companyId = company._id.toString();
    titleCompany = company.companyName;
    companyInitials = initialsFrom(company.companyName);
  }

  const order = await Order.create({
    orderNumber,
    title: payload.title,
    titleCompany,
    companyInitials,
    companyId,
    clientName: payload.clientName || payload.signerName,
    propertyAddress: payload.propertyAddress,
    signerName: payload.signerName || payload.clientName,
    signerPhone: payload.signerPhone,
    signingDate: payload.signingDate,
    signingTime: payload.signingTime,
    loanType: payload.loanType,
    scanbacksRequired: payload.scanbacksRequired ?? false,
    status: payload.status,
    priority: payload.priority,
    notaryPreference: payload.notaryPreference,
    preferredNotaryName: payload.preferredNotaryName,
    specialInstructions: payload.instructions,
    documents: (payload.documents ?? []).map((document) => ({
      name: document.name,
      meta: document.meta,
      uploadedBy: auth.role === 'company' ? 'Title Company' : 'Admin',
      uploadedAt: new Date(),
    })),
    timeline: [{ title: `Order created by ${auth.role === 'admin' ? 'Admin' : 'Title Company'}`, date: new Date(), tone: 'blue' }],
    createdByAdminId: auth.role === 'admin' ? auth.id : payload.createdByAdminId,
  });

  if (payload.documents?.length) {
    const uploaderRole = auth.role === 'company' ? 'company' : 'admin';
    const uploadedByName = auth.role === 'company' ? titleCompany : 'Closing Engage Admin';
    const uploadedBy = Types.ObjectId.isValid(auth.id) ? new Types.ObjectId(auth.id) : undefined;

    await ClosingDocument.insertMany(
      payload.documents.map((document) => {
        const s3Key = buildDocumentS3Key({
          role: uploaderRole,
          orderId: order.orderNumber,
          ownerId: auth.id,
          fileName: document.name,
        });

        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          fileName: document.name,
          fileSize: document.fileSize ?? 0,
          sizeLabel: sizeLabelFromBytes(document.fileSize, document.size || document.meta),
          mimeType: document.mimeType || 'application/pdf',
          uploadedBy,
          uploadedByName,
          uploaderRole,
          status: auth.role === 'company' ? 'Submitted' : 'Pending Review',
          s3Key,
          versions: [
            {
              s3Key,
              versionId: 'V1',
              fileName: document.name,
              fileSize: document.fileSize ?? 0,
              mimeType: document.mimeType || 'application/pdf',
              uploadedBy,
              uploaderRole,
              uploadedAt: new Date(),
            },
          ],
        };
      }),
    );
  }

  if (auth.role === 'company') {
    void notifyAdminsSafely({
      title: 'New Order Submitted',
      message: `${titleCompany} submitted ${order.orderNumber} for assignment and review.`,
      type: 'order',
      linkId: order.orderNumber,
    });

    void createNotificationSafely({
      recipientId: auth.id,
      recipientRole: 'company',
      title: 'Order Submitted',
      message: `Your order ${order.orderNumber} was received by Closing Engage.`,
      type: 'order',
      linkId: order.orderNumber,
    });
  }

  return auth.role === 'admin' ? serializeOrderRow(order) : serializePortalOrder(order);
};

export const getOrder = async (auth: AuthContext, id: string) => {
  const order = await findOrder(id, auth);
  return serializeOrderDetail(order);
};

export const updateOrder = async (
  auth: AuthContext,
  id: string,
  payload: Partial<{
    title: string;
    titleCompany: string;
    clientName?: string;
    propertyAddress: string;
    signerName?: string;
    signerPhone?: string;
    signingDate: string;
    signingTime: string;
    loanType?: LoanType;
    scanbacksRequired?: boolean;
    status: OrderStatus;
    priority: OrderPriority;
    notaryPreference: NotaryPreference;
    preferredNotaryName?: string;
    instructions?: string;
    notaryNotes?: string;
    documents?: OrderDocumentInput[];
  }>,
) => {
  const order = await findOrder(id, auth);

  if (auth.role === 'notary') {
    const notaryOnlyFields = Object.keys(payload).every((key) =>
      ['status', 'notaryNotes', 'signingDate', 'signingTime'].includes(key),
    );
    if (!notaryOnlyFields) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Notaries can only update assigned order status, notes, or schedule');
    }
  }

  if (auth.role === 'company' && payload.status !== undefined) {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Company users cannot update order status');
  }

  if (payload.title !== undefined) order.title = payload.title;
  if (payload.titleCompany !== undefined) {
    if (auth.role !== 'admin') {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins can change the title company');
    }
    order.titleCompany = payload.titleCompany;
    order.companyInitials = initialsFrom(payload.titleCompany);
  }
  if (payload.clientName !== undefined) {
    order.clientName = payload.clientName;
    order.signerName = payload.clientName;
  }
  if (payload.propertyAddress !== undefined) order.propertyAddress = payload.propertyAddress;
  if (payload.signerName !== undefined) order.signerName = payload.signerName;
  if (payload.signerPhone !== undefined) order.signerPhone = payload.signerPhone;
  if (payload.signingDate !== undefined) order.signingDate = payload.signingDate;
  if (payload.signingTime !== undefined) order.signingTime = payload.signingTime;
  if (payload.loanType !== undefined) order.loanType = payload.loanType;
  if (payload.scanbacksRequired !== undefined) order.scanbacksRequired = payload.scanbacksRequired;
  if (payload.status !== undefined && payload.status !== order.status) {
    order.status = payload.status;
    pushTimeline(order, `Order status changed to "${payload.status}"`, 'blue');
  }
  if (payload.priority !== undefined) order.priority = payload.priority;
  if (payload.notaryPreference !== undefined) order.notaryPreference = payload.notaryPreference;
  if (payload.preferredNotaryName !== undefined) order.preferredNotaryName = payload.preferredNotaryName;
  if (payload.instructions !== undefined) order.specialInstructions = payload.instructions;
  if (payload.notaryNotes !== undefined) order.notaryNotes = payload.notaryNotes;
  if (payload.documents?.length) {
    const uploadedByRole: IOrderDocument['uploadedBy'] =
      auth.role === 'company' ? 'Title Company' : auth.role === 'notary' ? 'Notary' : 'Admin';

    order.documents.unshift(
      ...payload.documents.map((document) => ({
        name: document.name,
        meta: document.meta,
        uploadedBy: uploadedByRole,
        uploadedAt: new Date(),
      })),
    );
    pushTimeline(order, `${payload.documents.length} document${payload.documents.length === 1 ? '' : 's'} added`, 'blue');
  }

  await order.save();
  return auth.role === 'admin' ? serializeOrderRow(order) : serializePortalOrder(order);
};

export const deleteOrder = async (auth: AuthContext, id: string): Promise<void> => {
  if (auth.role !== 'admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins can delete orders');
  }

  const order = await Order.findOneAndDelete(orderLookupQuery(id));

  if (!order) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Order not found');
  }
};

export const updateOrderStatus = async (auth: AuthContext, id: string, status: OrderStatus) => {
  if (auth.role === 'company') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Company users cannot update order status');
  }

  const order = await findOrder(id, auth);
  order.status = status;
  pushTimeline(order, `Order status changed to "${status}"`, status === 'Rejected' ? 'red' : 'blue');
  await order.save();
  return auth.role === 'admin' ? serializeOrderRow(order) : serializePortalOrder(order);
};

export const assignNotary = async (
  auth: AuthContext,
  id: string,
  payload: { notaryName: string; notaryId?: string; notaryEmail?: string },
) => {
  if (auth.role !== 'admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins can assign notaries');
  }

  const order = await findOrder(id, auth);
  let notaryId = payload.notaryId;
  let notaryName = payload.notaryName;

  if (!notaryId) {
    const notary = await NotaryUser.findOne({
      status: { $ne: 'Inactive' },
      $or: [{ fullName: payload.notaryName }, ...(payload.notaryEmail ? [{ email: payload.notaryEmail }] : [])],
    }).collation({ locale: 'en', strength: 2 });

    if (notary) {
      notaryId = notary._id.toString();
      notaryName = notary.fullName;
    }
  }

  order.assignedNotaryName = notaryName;
  order.avatarKey = avatarForNotary(notaryName);
  order.status = 'Assigned';
  if (notaryId && Types.ObjectId.isValid(notaryId)) {
    order.assignedNotaryId = new Types.ObjectId(notaryId);
  }
  pushTimeline(order, `Notary ${notaryName} assigned`, 'slate');

  await order.save();

  if (notaryId && Types.ObjectId.isValid(notaryId)) {
    void createNotificationSafely({
      recipientId: notaryId,
      recipientRole: 'notary',
      title: 'New Order Assigned',
      message: `You have been assigned to ${order.orderNumber}.`,
      type: 'order',
      linkId: order.orderNumber,
    });
  }

  if (order.companyId) {
    void createNotificationSafely({
      recipientId: order.companyId,
      recipientRole: 'company',
      title: 'Notary Assigned',
      message: `A notary has been assigned to your order ${order.orderNumber}.`,
      type: 'order',
      linkId: order.orderNumber,
    });
  }

  return serializeOrderRow(order);
};

export const confirmNotaryPrintedDocuments = async (auth: AuthContext, id: string) => {
  if (auth.role !== 'notary') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only notaries can confirm printed documents');
  }

  const order = await findOrder(id, auth);

  if (!order.notaryPrintedConfirmed) {
    order.notaryPrintedConfirmed = true;
    pushTimeline(order, 'Documents printed by notary confirmed', 'slate');
    await order.save();

    if (order.companyId) {
      void createNotificationSafely({
        recipientId: order.companyId,
        recipientRole: 'company',
        title: 'Documents Printed by Notary',
        message: `The notary confirmed printed documents for ${order.orderNumber}.`,
        type: 'order',
        linkId: order.orderNumber,
      });
    }

    void notifyAdminsSafely({
      title: 'Documents Printed by Notary',
      message: `The notary confirmed printed documents for ${order.orderNumber}.`,
      type: 'order',
      linkId: order.orderNumber,
    });
  }

  return serializeOrderDetail(order);
};

export const scheduleOrderMeeting = async (
  auth: AuthContext,
  id: string,
  payload: { signingDate: string; signingTime: string },
) => {
  if (auth.role === 'company') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Company users cannot schedule meetings');
  }

  const order = await findOrder(id, auth);
  const isReschedule = Boolean(order.meeting);

  order.signingDate = payload.signingDate;
  order.signingTime = payload.signingTime;
  order.meeting = {
    status: 'scheduled',
    date: payload.signingDate,
    time: payload.signingTime,
    scheduledByRole: auth.role,
    scheduledAt: new Date(),
  };

  pushTimeline(
    order,
    `${isReschedule ? 'Closing rescheduled' : 'Closing scheduled'} for ${payload.signingDate} at ${payload.signingTime}`,
    'blue',
  );

  await order.save();

  if (order.companyId) {
    void createNotificationSafely({
      recipientId: order.companyId,
      recipientRole: 'company',
      title: isReschedule ? 'Closing Rescheduled' : 'Closing Scheduled',
      message: `The notary scheduled ${order.orderNumber} for ${payload.signingDate} at ${payload.signingTime}. Please review and confirm the meeting.`,
      type: 'order',
      linkId: order.orderNumber,
    });
  }

  void notifyAdminsSafely({
    title: isReschedule ? 'Closing Rescheduled' : 'Closing Scheduled',
    message: `${order.orderNumber} is scheduled for ${payload.signingDate} at ${payload.signingTime}.`,
    type: 'order',
    linkId: order.orderNumber,
  });

  return serializeOrderDetail(order);
};

export const confirmOrderMeeting = async (auth: AuthContext, id: string) => {
  if (auth.role === 'notary') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only company users or admins can confirm meetings');
  }

  const order = await findOrder(id, auth);

  if (!order.meeting) {
    throw new HttpError(StatusCodes.BAD_REQUEST, 'No scheduled meeting exists for this order');
  }

  if (order.meeting.status === 'confirmed') {
    return serializeOrderDetail(order);
  }

  order.meeting.status = 'confirmed';
  order.meeting.confirmedAt = new Date();
  order.meeting.confirmedByRole = auth.role;
  pushTimeline(order, `Closing confirmed for ${order.meeting.date} at ${order.meeting.time}`, 'green');

  await order.save();

  if (order.assignedNotaryId) {
    void createNotificationSafely({
      recipientId: order.assignedNotaryId,
      recipientRole: 'notary',
      title: 'Closing Confirmed',
      message: `The title company confirmed ${order.orderNumber} for ${order.meeting.date} at ${order.meeting.time}.`,
      type: 'order',
      linkId: order.orderNumber,
    });
  }

  if (order.companyId && auth.role === 'admin') {
    void createNotificationSafely({
      recipientId: order.companyId,
      recipientRole: 'company',
      title: 'Closing Confirmed',
      message: `Your closing for ${order.orderNumber} is confirmed for ${order.meeting.date} at ${order.meeting.time}.`,
      type: 'order',
      linkId: order.orderNumber,
    });
  }

  void notifyAdminsSafely({
    title: 'Closing Confirmed',
    message: `${order.orderNumber} has a confirmed closing for ${order.meeting.date} at ${order.meeting.time}.`,
    type: 'order',
    linkId: order.orderNumber,
  });

  return serializeOrderDetail(order);
};

export const listOrderTimeline = async (auth: AuthContext, id: string) => {
  const order = await findOrder(id, auth);
  return serializeOrderDetail(order).timeline;
};
