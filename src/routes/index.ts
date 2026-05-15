import { Router } from 'express';

import { healthRouter } from '../modules/health/health.route';
import { teamRouter } from '../modules/team/team.route';

const router = Router();

router.use('/health', healthRouter);
router.use('/team', teamRouter);

export const apiRouter = router;
