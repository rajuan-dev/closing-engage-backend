import { AdminUser } from '../auth/auth.model';
import { ClosingDocument } from '../documents/documents.model';
import { Notification } from '../notifications/notifications.model';
import { Order } from '../orders/orders.model';
import { CompanyUser } from '../user/company-user.model';
import { NotaryUser } from '../user/notary-user.model';

type DashboardPeriod = '7d' | '30d' | '90d';

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfLocalDay = (value: Date): Date => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const resolveTrendWindow = (period: DashboardPeriod) => {
  const now = new Date();
  const todayStart = startOfLocalDay(now);
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const start = new Date(todayStart.getTime() - (days - 1) * DAY_MS);
  const endExclusive = new Date(todayStart.getTime() + DAY_MS);
  return { start, endExclusive, days };
};

const formatMetricDelta = (current: number, previous: number): string | undefined => {
  if (current === previous) return undefined;
  if (previous === 0) return current > 0 ? '+100%' : undefined;

  const delta = Math.round(((current - previous) / previous) * 100);
  return `${delta >= 0 ? '+' : ''}${delta}%`;
};

const buildTrendBuckets = (period: DashboardPeriod, start: Date, endExclusive: Date) => {
  const bucketCount = period === '7d' ? 7 : period === '90d' ? 6 : 8;
  const spanMs = endExclusive.getTime() - start.getTime();
  const bucketMs = Math.ceil(spanMs / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start.getTime() + index * bucketMs);
    const bucketEnd = new Date(index === bucketCount - 1 ? endExclusive.getTime() : start.getTime() + (index + 1) * bucketMs);

    return {
      label: period === '7d' ? bucketStart.toLocaleDateString('en-US', { weekday: 'short' }) : `Week ${index + 1}`,
      start: bucketStart,
      end: bucketEnd,
    };
  });
};

const distinctActorKeysForNotifications = async (start: Date, end: Date): Promise<string[]> => {
  const recipients = await Notification.aggregate<{ _id: { id: unknown; role: string } }>([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: { id: '$recipientId', role: '$recipientRole' } } },
  ]);

  return recipients.map((entry) => `${entry._id.role}:${String(entry._id.id)}`);
};

export const getDashboardOverview = async (period: DashboardPeriod) => {
  const { start, endExclusive } = resolveTrendWindow(period);
  const previousWindowStart = new Date(start.getTime() - (endExclusive.getTime() - start.getTime()));

  const [
    totalCompanies,
    previousCompanies,
    totalNotaries,
    previousNotaries,
    totalOrders,
    pendingApprovalOrders,
    completedOrders,
    pendingReviewDocuments,
    unassignedOrders,
  ] = await Promise.all([
    CompanyUser.countDocuments({ createdAt: { $lt: endExclusive } }),
    CompanyUser.countDocuments({ createdAt: { $lt: start } }),
    NotaryUser.countDocuments({ createdAt: { $lt: endExclusive } }),
    NotaryUser.countDocuments({ createdAt: { $lt: start } }),
    Order.countDocuments({ createdAt: { $lt: endExclusive } }),
    Order.countDocuments({ status: { $in: ['Under Review', 'Submitted', 'Pending Upload'] } }),
    Order.countDocuments({ status: 'Completed' }),
    ClosingDocument.countDocuments({ status: 'Pending Review' }),
    Order.countDocuments({
      $or: [{ assignedNotaryId: { $exists: false } }, { assignedNotaryId: null }, { assignedNotaryName: 'Unassigned' }],
    }),
  ]);

  const companyNote = formatMetricDelta(totalCompanies, previousCompanies);
  const notaryNote = formatMetricDelta(totalNotaries, previousNotaries);
  const completionRate = totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : undefined;

  const buckets = buildTrendBuckets(period, start, endExclusive);
  const trendData = await Promise.all(
    buckets.map(async (bucket) => {
      const actorKeys = new Set<string>();

      const [notificationActors, orderActors, documentActors, adminActors] = await Promise.all([
        distinctActorKeysForNotifications(bucket.start, bucket.end),
        Order.aggregate<{ _id: { companyId?: unknown; assignedNotaryId?: unknown } }>([
          { $match: { createdAt: { $gte: bucket.start, $lt: bucket.end } } },
          { $project: { companyId: 1, assignedNotaryId: 1 } },
        ]),
        ClosingDocument.aggregate<{ _id: { uploadedBy?: unknown; uploaderRole: string } }>([
          { $match: { createdAt: { $gte: bucket.start, $lt: bucket.end }, uploadedBy: { $exists: true, $ne: null } } },
          { $group: { _id: { uploadedBy: '$uploadedBy', uploaderRole: '$uploaderRole' } } },
        ]),
        AdminUser.find({ isActive: true }).select('_id'),
      ]);

      notificationActors.forEach((key) => actorKeys.add(key));

      orderActors.forEach((entry) => {
        if (entry._id.companyId) actorKeys.add(`company:${String(entry._id.companyId)}`);
        if (entry._id.assignedNotaryId) actorKeys.add(`notary:${String(entry._id.assignedNotaryId)}`);
      });

      documentActors.forEach((entry) => {
        actorKeys.add(`${entry._id.uploaderRole}:${String(entry._id.uploadedBy)}`);
      });

      if (actorKeys.size > 0) {
        adminActors.forEach((admin) => actorKeys.add(`admin:${admin._id.toString()}`));
      }

      return {
        label: bucket.label,
        value: actorKeys.size,
      };
    }),
  );

  return {
    generatedAt: new Date().toISOString(),
    trendPeriod: period,
    metrics: {
      totalCompanies: {
        value: totalCompanies,
        note: companyNote,
      },
      totalNotaries: {
        value: totalNotaries,
        note: notaryNote,
      },
      totalOrders: {
        value: totalOrders,
      },
      pendingApprovalOrders: {
        value: pendingApprovalOrders,
        note: pendingApprovalOrders > 0 ? 'Alert' : undefined,
      },
      completedOrders: {
        value: completedOrders,
        note: completionRate,
      },
    },
    activeUsersTrend: trendData,
    quickActions: [
      {
        key: 'add-user',
        title: 'Add User',
        description: `Manage ${totalCompanies + totalNotaries} company and notary accounts`,
        tone: 'blue',
      },
      {
        key: 'assign-orders',
        title: 'Assign Orders',
        description:
          unassignedOrders === 1
            ? 'Route 1 unassigned file to an available notary'
            : `Route ${unassignedOrders} unassigned files to available notaries`,
        tone: 'slate',
      },
      {
        key: 'approve-documents',
        title: 'Approve Documents',
        description:
          pendingReviewDocuments === 1
            ? 'Verify and sign-off on 1 pending document'
            : `Verify and sign-off on ${pendingReviewDocuments} pending documents`,
        tone: 'amber',
      },
    ],
    comparisonWindow: {
      currentStart: start.toISOString(),
      currentEnd: new Date(endExclusive.getTime() - 1).toISOString(),
      previousStart: previousWindowStart.toISOString(),
      previousEnd: new Date(start.getTime() - 1).toISOString(),
    },
  };
};
