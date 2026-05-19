import { Router } from 'express';

import { accessRequestRouter } from '../modules/access-request/access-request.route';
import { authRouter } from '../modules/auth/auth.route';
import { healthRouter } from '../modules/health/health.route';
import { teamRouter } from '../modules/team/team.route';
import { userRouter } from '../modules/user/user.route';

const router = Router();

router.use('/access-requests', accessRequestRouter);
router.use('/auth', authRouter);
router.use('/health', healthRouter);
router.use('/team', teamRouter);
router.use('/users', userRouter);

export const apiRouter = router;
