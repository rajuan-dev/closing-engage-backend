import { StatusCodes } from 'http-status-codes';

import { HttpError } from '../../core/http-error';
import { Order, orderStatuses, type OrderStatus } from '../orders/orders.model';

type AnalyticsRange = 'today' | '7d' | '30d' | '90d' | 'custom';

type OverviewFilters = {
  range?: string;
  startDate?: string;
  endDate?: string;
};

type TrendBucket = {
  label: string;
  start: Date;
  end: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TERMINAL_STATUSES = new Set<OrderStatus>(['Completed', 'Rejected']);
const PENDING_STATUSES = orderStatuses.filter((status) => !TERMINAL_STATUSES.has(status)) as OrderStatus[];

const formatMetricDelta = (current: number, previous: number): string | undefined => {
  if (current === 0 && previous === 0) return undefined;
  if (previous === 0) return current > 0 ? '+100%' : undefined;

  const raw = ((current - previous) / previous) * 100;
  const rounded = Math.round(raw);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
};

const formatInitials = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || value.trim().slice(0, 2).toUpperCase();

const startOfLocalDay = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const parseDateOnly = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeRange = (range?: string): AnalyticsRange => {
  if (range === 'today' || range === '7d' || range === '30d' || range === '90d' || range === 'custom') {
    return range;
  }
  return '30d';
};

const resolveDateRange = (filters: OverviewFilters) => {
  const range = normalizeRange(filters.range);
  const now = new Date();

  if (range === 'custom') {
    const customStart = filters.startDate ? parseDateOnly(filters.startDate) : null;
    const customEnd = filters.endDate ? parseDateOnly(filters.endDate) : null;

    if (!customStart || !customEnd) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Start date and end date are required for a custom range');
    }

    if (customEnd.getTime() < customStart.getTime()) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'End date must be on or after the start date');
    }

    const start = customStart;
    const endExclusive = new Date(customEnd.getTime() + DAY_MS);
    return { range, start, endExclusive, durationMs: endExclusive.getTime() - start.getTime() };
  }

  const todayStart = startOfLocalDay(now);

  if (range === 'today') {
    const start = todayStart;
    const endExclusive = new Date(todayStart.getTime() + DAY_MS);
    return { range, start, endExclusive, durationMs: DAY_MS };
  }

  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const start = new Date(todayStart.getTime() - (days - 1) * DAY_MS);
  const endExclusive = new Date(todayStart.getTime() + DAY_MS);

  return { range, start, endExclusive, durationMs: endExclusive.getTime() - start.getTime() };
};

const buildTrendBuckets = (range: AnalyticsRange, start: Date, endExclusive: Date): TrendBucket[] => {
  const durationMs = endExclusive.getTime() - start.getTime();
  const durationDays = Math.max(1, Math.ceil(durationMs / DAY_MS));

  if (range === 'today') {
    return Array.from({ length: 6 }, (_, index) => {
      const bucketStart = new Date(start.getTime() + index * 4 * 60 * 60 * 1000);
      const bucketEnd = new Date(Math.min(bucketStart.getTime() + 4 * 60 * 60 * 1000, endExclusive.getTime()));
      return {
        label: bucketStart.toLocaleTimeString('en-US', { hour: 'numeric' }).replace(' ', ''),
        start: bucketStart,
        end: bucketEnd,
      };
    });
  }

  if (durationDays <= 10) {
    return Array.from({ length: durationDays }, (_, index) => {
      const bucketStart = new Date(start.getTime() + index * DAY_MS);
      const bucketEnd = new Date(Math.min(bucketStart.getTime() + DAY_MS, endExclusive.getTime()));
      return {
        label: bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        start: bucketStart,
        end: bucketEnd,
      };
    });
  }

  const bucketCount = range === '90d' ? 6 : 5;
  const rawBucketSize = Math.ceil(durationMs / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start.getTime() + index * rawBucketSize);
    const bucketEnd = new Date(index === bucketCount - 1 ? endExclusive.getTime() : start.getTime() + (index + 1) * rawBucketSize);

    return {
      label:
        durationDays <= 45
          ? `Wk ${index + 1}`
          : bucketStart.toLocaleDateString('en-US', { month: 'short' }),
      start: bucketStart,
      end: bucketEnd,
    };
  });
};

const buildBucketBoundaries = (buckets: TrendBucket[]): Date[] => [
  buckets[0].start,
  ...buckets.map((bucket) => bucket.end),
];

export const getAnalyticsOverview = async (filters: OverviewFilters) => {
  const { range, start, endExclusive, durationMs } = resolveDateRange(filters);
  const previousStart = new Date(start.getTime() - durationMs);
  const previousEndExclusive = start;

  const [currentTotalOrders, previousTotalOrders, completedOrders, pendingOrders, activeNotariesGrouped, activeCompaniesGrouped] =
    await Promise.all([
      Order.countDocuments({ createdAt: { $gte: start, $lt: endExclusive } }),
      Order.countDocuments({ createdAt: { $gte: previousStart, $lt: previousEndExclusive } }),
      Order.countDocuments({ createdAt: { $gte: start, $lt: endExclusive }, status: 'Completed' }),
      Order.countDocuments({
        createdAt: { $gte: start, $lt: endExclusive },
        status: { $in: PENDING_STATUSES },
      }),
      Order.aggregate<{ _id: unknown }>([
        { $match: { createdAt: { $gte: start, $lt: endExclusive }, assignedNotaryId: { $exists: true, $ne: null } } },
        { $group: { _id: '$assignedNotaryId' } },
      ]),
      Order.aggregate<{ _id: { companyId?: unknown; titleCompany: string } }>([
        { $match: { createdAt: { $gte: start, $lt: endExclusive } } },
        {
          $group: {
            _id: {
              companyId: '$companyId',
              titleCompany: '$titleCompany',
            },
          },
        },
      ]),
    ]);

  const statusCounts = await Order.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: start, $lt: endExclusive } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusCountMap = new Map(statusCounts.map((entry) => [entry._id, entry.count]));
  const ordersByStatus = orderStatuses.map((status) => ({
    label: status,
    shortLabel: status.length > 12 ? status.replace(/\s+/g, '\n') : status,
    value: statusCountMap.get(status) ?? 0,
  }));

  const trendBuckets = buildTrendBuckets(range, start, endExclusive);
  const trendBoundaries = buildBucketBoundaries(trendBuckets);
  const trendGrouped = await Order.aggregate<{ _id: Date; value: number }>([
    { $match: { createdAt: { $gte: start, $lt: endExclusive } } },
    {
      $bucket: {
        groupBy: '$createdAt',
        boundaries: trendBoundaries,
        default: endExclusive,
        output: {
          value: { $sum: 1 },
        },
      },
    },
  ]);

  const trendMap = new Map(trendGrouped.map((entry) => [new Date(entry._id).getTime(), entry.value]));
  const ordersTrend = trendBuckets.map((bucket) => ({
    label: bucket.label,
    value: trendMap.get(bucket.start.getTime()) ?? 0,
  }));

  const topNotariesRaw = await Order.aggregate<{
    _id: unknown;
    name: string;
    completedOrders: number;
  }>([
    {
      $match: {
        createdAt: { $gte: start, $lt: endExclusive },
        status: 'Completed',
        assignedNotaryId: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$assignedNotaryId',
        name: { $first: '$assignedNotaryName' },
        completedOrders: { $sum: 1 },
      },
    },
    { $sort: { completedOrders: -1, name: 1 } },
    { $limit: 5 },
  ]);

  const topCompaniesRaw = await Order.aggregate<{
    _id: { companyId?: unknown; titleCompany: string };
    orderCount: number;
  }>([
    { $match: { createdAt: { $gte: start, $lt: endExclusive } } },
    {
      $group: {
        _id: {
          companyId: '$companyId',
          titleCompany: '$titleCompany',
        },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { orderCount: -1, '_id.titleCompany': 1 } },
    { $limit: 5 },
  ]);

  return {
    range,
    generatedAt: new Date().toISOString(),
    filters: {
      startDate: start.toISOString(),
      endDate: new Date(endExclusive.getTime() - 1).toISOString(),
    },
    metrics: {
      totalOrders: {
        value: currentTotalOrders,
        note: formatMetricDelta(currentTotalOrders, previousTotalOrders),
      },
      completedOrders,
      pendingOrders,
      activeNotaries: activeNotariesGrouped.length,
      titleCompanies: activeCompaniesGrouped.length,
    },
    ordersByStatus,
    ordersTrend,
    topNotaries: topNotariesRaw.map((entry) => ({
      id: String(entry._id),
      initials: formatInitials(entry.name || 'NA'),
      name: entry.name || 'Unknown Notary',
      completedOrders: entry.completedOrders,
    })),
    topCompanies: topCompaniesRaw.map((entry) => ({
      id: entry._id.companyId ? String(entry._id.companyId) : entry._id.titleCompany,
      name: entry._id.titleCompany,
      subtitle: entry.orderCount === 1 ? '1 order in selected range' : `${entry.orderCount} orders in selected range`,
      orderCount: entry.orderCount,
    })),
  };
};
