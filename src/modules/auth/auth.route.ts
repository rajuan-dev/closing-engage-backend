import { Router } from 'express';

import { requireAdminAuth, requireCompanyAuth, requireNotaryAuth } from '../../middlewares/auth.middleware';
import * as authController from './auth.controller';

const router = Router();

router.post('/admin/login', authController.login);
router.get('/admin/me', requireAdminAuth, authController.me);
router.patch('/admin/profile', requireAdminAuth, authController.updateProfile);
router.patch('/admin/password', requireAdminAuth, authController.changePassword);

router.post('/company/login', authController.loginCompanyUser);
router.get('/company/me', requireCompanyAuth, authController.companyMe);
router.patch('/company/profile', requireCompanyAuth, authController.updateCompanyAccountProfile);
router.patch('/company/password', requireCompanyAuth, authController.changeCompanyPassword);

router.post('/notary/login', authController.loginNotaryUser);
router.get('/notary/me', requireNotaryAuth, authController.notaryMe);
router.patch('/notary/profile', requireNotaryAuth, authController.updateNotaryAccountProfile);
router.patch('/notary/password', requireNotaryAuth, authController.changeNotaryPassword);

router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

export const authRouter = router;
