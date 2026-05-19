import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../core/http-error';
import { createNotificationSafely } from '../notifications/notifications.service';
import { CompanyUser } from '../user/company-user.model';
import { NotaryUser } from '../user/notary-user.model';
import { IOrder, IOrderDocument, LoanType, NotaryPreference, Order, OrderPriority, OrderStatus } from './orders.model';

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

const pushTimeline = (order: IOrder, title: string, tone: 'blue' | 'slate' | 'green' | 'red' = 'blue'): void => {
  order.timeline.unshift({ title, date: new Date(), tone });
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
  notary: order.assignedNotaryName === 'Unassigned' ? '--' : order.assignedNotaryName,
  assignedNotaryName: order.assignedNotaryName,
  assignedNotaryId: order.assignedNotaryId?.toString() ?? '',
  avatarKey: order.avatarKey,
  specialInstructions: order.specialInstructions ?? '',
  notaryNotes: order.notaryNotes ?? '',
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
  instructions?: string;
  documents?: Pick<IOrderDocument, 'name' | 'meta'>[];
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
    specialInstructions: payload.instructions,
    documents: (payload.documents ?? []).map((document) => ({
      ...document,
      uploadedBy: 'Admin',
      uploadedAt: new Date(),
    })),
    timeline: [{ title: `Order created by ${auth.role === 'admin' ? 'Admin' : 'Title Company'}`, date: new Date(), tone: 'blue' }],
    createdByAdminId: auth.role === 'admin' ? auth.id : payload.createdByAdminId,
  });

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
    instructions?: string;
    notaryNotes?: string;
  }>,
) => {
  const order = await findOrder(id, auth);

  if (auth.role === 'notary') {
    const notaryOnlyFields = Object.keys(payload).every((key) => ['status', 'notaryNotes'].includes(key));
    if (!notaryOnlyFields) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Notaries can only update assigned order status or notes');
    }
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
  if (payload.instructions !== undefined) order.specialInstructions = payload.instructions;
  if (payload.notaryNotes !== undefined) order.notaryNotes = payload.notaryNotes;

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
  const order = await findOrder(id, auth);
  order.status = status;
  pushTimeline(order, `Order status changed to "${status}"`, status === 'Rejected' ? 'red' : 'blue');
  await order.save();
  return auth.role === 'admin' ? serializeOrderRow(order) : serializePortalOrder(order);
};

export const assignNotary = async (auth: AuthContext, id: string, payload: { notaryName: string; notaryId?: string }) => {
  if (auth.role !== 'admin') {
    throw new HttpError(StatusCodes.FORBIDDEN, 'Only admins can assign notaries');
  }

  const order = await findOrder(id, auth);
  let notaryId = payload.notaryId;
  let notaryName = payload.notaryName;

  if (!notaryId) {
    const notary = await NotaryUser.findOne({ fullName: payload.notaryName });
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

export const listOrderTimeline = async (auth: AuthContext, id: string) => {
  const order = await findOrder(id, auth);
  return serializeOrderDetail(order).timeline;
};
