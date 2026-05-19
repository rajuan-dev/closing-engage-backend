import { Router } from 'express';

import { requireAnyAuth } from '../../middlewares/auth.middleware';
import * as notificationController from './notifications.controller';

const router = Router();

router.use(requireAnyAuth);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.patchAllNotificationsRead);
router.patch('/:id/read', notificationController.patchNotificationRead);

export const notificationRouter = router;
