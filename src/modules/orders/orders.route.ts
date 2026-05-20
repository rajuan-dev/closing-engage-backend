import { Router } from 'express';

import { requireAnyAuth, requireNotaryAuth } from '../../middlewares/auth.middleware';
import * as orderController from './orders.controller';

const router = Router();

router.use(requireAnyAuth);

router.get('/', orderController.getOrders);
router.post('/', orderController.postOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id', orderController.patchOrder);
router.delete('/:id', orderController.removeOrder);
router.patch('/:id/status', orderController.patchOrderStatus);
router.patch('/:id/notary-status', requireNotaryAuth, orderController.patchNotaryOrderStatus);
router.patch('/:id/assign-notary', orderController.patchOrderAssignment);
router.patch('/:id/printed-confirmation', orderController.patchOrderPrintedConfirmation);
router.patch('/:id/meeting', orderController.patchOrderMeeting);
router.patch('/:id/meeting/confirm', orderController.patchOrderMeetingConfirmation);
router.get('/:id/timeline', orderController.getOrderTimeline);

export const orderRouter = router;
