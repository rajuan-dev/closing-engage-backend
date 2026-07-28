import { Router } from 'express';

import { requireAnyAuth } from '../../middlewares/auth.middleware';
import * as pushDevicesController from './push-devices.controller';

const router = Router();

router.use(requireAnyAuth);
router.post('/register', pushDevicesController.postRegisterPushDevice);
router.post('/unregister', pushDevicesController.postUnregisterPushDevice);

export const pushDevicesRouter = router;
