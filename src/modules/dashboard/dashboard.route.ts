import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/auth.middleware';
import * as dashboardController from './dashboard.controller';

const router = Router();

router.use(requireAdminAuth);

router.get('/overview', dashboardController.getOverview);

export const dashboardRouter = router;
