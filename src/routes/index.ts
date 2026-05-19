import { Router } from 'express';

import { accessRequestRouter } from '../modules/access-request/access-request.route';
import { authRouter } from '../modules/auth/auth.route';
import { documentRouter } from '../modules/documents/documents.route';
import { healthRouter } from '../modules/health/health.route';
import { notificationRouter } from '../modules/notifications/notifications.route';
import { orderRouter } from '../modules/orders/orders.route';
import { teamRouter } from '../modules/team/team.route';
import { userRouter } from '../modules/user/user.route';

const router = Router();

router.use('/access-requests', accessRequestRouter);
router.use('/auth', authRouter);
router.use('/documents', documentRouter);
router.use('/health', healthRouter);
router.use('/notifications', notificationRouter);
router.use('/orders', orderRouter);
router.use('/team', teamRouter);
router.use('/users', userRouter);

export const apiRouter = router;
