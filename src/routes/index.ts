import { Router } from 'express';

import { accessRequestRouter } from '../modules/access-request/access-request.route';
import { analyticsRouter } from '../modules/analytics/analytics.route';
import { authRouter } from '../modules/auth/auth.route';
import { communicationRouter } from '../modules/communications/communications.route';
import { dashboardRouter } from '../modules/dashboard/dashboard.route';
import { documentRouter } from '../modules/documents/documents.route';
import { healthRouter } from '../modules/health/health.route';
import { notificationRouter } from '../modules/notifications/notifications.route';
import { orderRouter } from '../modules/orders/orders.route';
import { searchRouter } from '../modules/search/search.route';
import { teamRouter } from '../modules/team/team.route';
import { userRouter } from '../modules/user/user.route';

const router = Router();

router.use('/access-requests', accessRequestRouter);
router.use('/analytics', analyticsRouter);
router.use('/auth', authRouter);
router.use('/communications', communicationRouter);
router.use('/dashboard', dashboardRouter);
router.use('/documents', documentRouter);
router.use('/health', healthRouter);
router.use('/notifications', notificationRouter);
router.use('/orders', orderRouter);
router.use('/search', searchRouter);
router.use('/team', teamRouter);
router.use('/users', userRouter);

export const apiRouter = router;
