import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/auth.middleware';
import * as authController from './auth.controller';

const router = Router();

router.post('/admin/login', authController.login);
router.get('/admin/me', requireAdminAuth, authController.me);
router.patch('/admin/profile', requireAdminAuth, authController.updateProfile);
router.patch('/admin/password', requireAdminAuth, authController.changePassword);

export const authRouter = router;
