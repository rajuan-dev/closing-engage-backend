import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import { HttpError } from '../../core/http-error';
import { IOrder, IOrderDocument, Order, OrderPriority, OrderStatus, NotaryPreference } from './order.model';

type OrderRow = [string, string, string, string, string, string, OrderStatus, 'none' | 'jane' | 'mark'];

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

const findOrder = async (id: string): Promise<IOrder> => {
  const query = Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id };
  const order = await Order.findOne(query);

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
  titleCompany: order.titleCompany,
  companyInitials: order.companyInitials,
  signerName: order.signerName ?? '',
  signerPhone: order.signerPhone ?? '',
  propertyAddress: order.propertyAddress,
  signingDate: order.signingDate,
  signingTime: order.signingTime,
  status: order.status,
  priority: order.priority,
  notaryPreference: order.notaryPreference,
  assignedNotaryName: order.assignedNotaryName,
  avatarKey: order.avatarKey,
  specialInstructions: order.specialInstructions ?? '',
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

export const listOrders = async (filters: { status?: OrderStatus; search?: string }) => {
  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    query.$text = { $search: filters.search };
  }

  const orders = await Order.find(query).sort({ createdAt: -1 });
  return orders.map(serializeOrderRow);
};

export const createOrder = async (payload: {
  titleCompany: string;
  propertyAddress: string;
  signerName?: string;
  signerPhone?: string;
  signingDate: string;
  signingTime: string;
  status: OrderStatus;
  priority: OrderPriority;
  notaryPreference: NotaryPreference;
  instructions?: string;
  documents?: Pick<IOrderDocument, 'name' | 'meta'>[];
  createdByAdminId?: string;
}) => {
  let orderNumber = generateOrderNumber();
  while (await Order.exists({ orderNumber })) {
    orderNumber = generateOrderNumber();
  }

  const order = await Order.create({
    orderNumber,
    titleCompany: payload.titleCompany,
    companyInitials: initialsFrom(payload.titleCompany),
    propertyAddress: payload.propertyAddress,
    signerName: payload.signerName,
    signerPhone: payload.signerPhone,
    signingDate: payload.signingDate,
    signingTime: payload.signingTime,
    status: payload.status,
    priority: payload.priority,
    notaryPreference: payload.notaryPreference,
    specialInstructions: payload.instructions,
    documents: (payload.documents ?? []).map((document) => ({
      ...document,
      uploadedBy: 'Admin',
      uploadedAt: new Date(),
    })),
    timeline: [{ title: 'Order created by Admin', date: new Date(), tone: 'blue' }],
    createdByAdminId: payload.createdByAdminId,
  });

  return serializeOrderRow(order);
};

export const getOrder = async (id: string) => {
  const order = await findOrder(id);
  return serializeOrderDetail(order);
};

export const updateOrder = async (
  id: string,
  payload: Partial<{
    titleCompany: string;
    propertyAddress: string;
    signerName?: string;
    signerPhone?: string;
    signingDate: string;
    signingTime: string;
    status: OrderStatus;
    priority: OrderPriority;
    notaryPreference: NotaryPreference;
    instructions?: string;
  }>,
) => {
  const order = await findOrder(id);

  if (payload.titleCompany !== undefined) {
    order.titleCompany = payload.titleCompany;
    order.companyInitials = initialsFrom(payload.titleCompany);
  }
  if (payload.propertyAddress !== undefined) order.propertyAddress = payload.propertyAddress;
  if (payload.signerName !== undefined) order.signerName = payload.signerName;
  if (payload.signerPhone !== undefined) order.signerPhone = payload.signerPhone;
  if (payload.signingDate !== undefined) order.signingDate = payload.signingDate;
  if (payload.signingTime !== undefined) order.signingTime = payload.signingTime;
  if (payload.status !== undefined && payload.status !== order.status) {
    order.status = payload.status;
    pushTimeline(order, `Order status changed to "${payload.status}"`, 'blue');
  }
  if (payload.priority !== undefined) order.priority = payload.priority;
  if (payload.notaryPreference !== undefined) order.notaryPreference = payload.notaryPreference;
  if (payload.instructions !== undefined) order.specialInstructions = payload.instructions;

  await order.save();
  return serializeOrderRow(order);
};

export const deleteOrder = async (id: string): Promise<void> => {
  const query = Types.ObjectId.isValid(id) ? { _id: id } : { orderNumber: id };
  const order = await Order.findOneAndDelete(query);

  if (!order) {
    throw new HttpError(StatusCodes.NOT_FOUND, 'Order not found');
  }
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const order = await findOrder(id);
  order.status = status;
  pushTimeline(order, `Order status changed to "${status}"`, status === 'Rejected' ? 'red' : 'blue');
  await order.save();
  return serializeOrderRow(order);
};

export const assignNotary = async (id: string, payload: { notaryName: string; notaryId?: string }) => {
  const order = await findOrder(id);

  order.assignedNotaryName = payload.notaryName;
  order.avatarKey = avatarForNotary(payload.notaryName);
  order.status = 'Assigned';
  if (payload.notaryId && Types.ObjectId.isValid(payload.notaryId)) {
    order.assignedNotaryId = new Types.ObjectId(payload.notaryId);
  }
  pushTimeline(order, `Notary ${payload.notaryName} assigned`, 'slate');

  await order.save();
  return serializeOrderRow(order);
};

export const listOrderTimeline = async (id: string) => {
  const order = await findOrder(id);
  return serializeOrderDetail(order).timeline;
};
