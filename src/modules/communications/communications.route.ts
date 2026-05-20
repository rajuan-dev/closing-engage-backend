import { Router } from 'express';

import { requireAnyAuth } from '../../middlewares/auth.middleware';
import * as communicationController from './communications.controller';

const router = Router();

router.use(requireAnyAuth);

router.get('/threads', communicationController.getThreads);
router.get('/orders/:orderNumber/thread', communicationController.getOrderThread);
router.get('/orders/:orderNumber/messages', communicationController.getOrderMessages);
router.post('/orders/:orderNumber/messages', communicationController.postOrderMessage);

export const communicationRouter = router;
