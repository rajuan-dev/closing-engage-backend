import { Router } from 'express';

import { requireAnyAuth } from '../../middlewares/auth.middleware';
import * as orderController from './orders.controller';

const router = Router();

router.use(requireAnyAuth);

router.get('/', orderController.getOrders);
router.post('/', orderController.postOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id', orderController.patchOrder);
router.delete('/:id', orderController.removeOrder);
router.patch('/:id/status', orderController.patchOrderStatus);
router.patch('/:id/assign-notary', orderController.patchOrderAssignment);
router.get('/:id/timeline', orderController.getOrderTimeline);

export const orderRouter = router;
