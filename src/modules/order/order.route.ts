import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/auth.middleware';
import * as orderController from './order.controller';

const router = Router();

router.use(requireAdminAuth);

router.get('/', orderController.getOrders);
router.post('/', orderController.postOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id', orderController.patchOrder);
router.delete('/:id', orderController.removeOrder);
router.patch('/:id/status', orderController.patchOrderStatus);
router.patch('/:id/assign-notary', orderController.patchOrderAssignment);
router.get('/:id/timeline', orderController.getOrderTimeline);

export const orderRouter = router;
