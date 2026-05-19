import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.route';
import { healthRouter } from '../modules/health/health.route';
import { teamRouter } from '../modules/team/team.route';

const router = Router();

router.use('/auth', authRouter);
router.use('/health', healthRouter);
router.use('/team', teamRouter);

export const apiRouter = router;
