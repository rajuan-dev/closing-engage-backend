import { Router } from 'express';

import { requireAnyAuth } from '../../middlewares/auth.middleware';
import * as notificationController from './notifications.controller';

const router = Router();

router.use(requireAnyAuth);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.patchAllNotificationsRead);
router.delete('/clear-all', notificationController.deleteAllNotifications);
router.patch('/:id/read', notificationController.patchNotificationRead);
router.delete('/:id', notificationController.deleteSingleNotification);

export const notificationRouter = router;
