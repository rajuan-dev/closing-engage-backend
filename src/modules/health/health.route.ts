import { Router } from 'express';

import { getHealthStatus } from './health.controller';

const router = Router();

router.get('/', getHealthStatus);

export const healthRouter = router;
