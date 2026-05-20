import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/auth.middleware';
import * as analyticsController from './analytics.controller';

const router = Router();

router.use(requireAdminAuth);

router.get('/overview', analyticsController.getOverview);

export const analyticsRouter = router;
