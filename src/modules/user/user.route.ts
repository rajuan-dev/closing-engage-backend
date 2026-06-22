import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/auth.middleware';
import * as userController from './user.controller';

const router = Router();

router.use(requireAdminAuth);

router.get('/companies', userController.getCompanies);
router.post('/companies', userController.postCompany);
router.patch('/companies/:id', userController.patchCompany);
router.delete('/companies/:id', userController.removeCompany);

router.get('/notaries', userController.getNotaries);
router.post('/notaries', userController.postNotary);
router.patch('/notaries/:id', userController.patchNotary);
router.delete('/notaries/:id', userController.removeNotary);

router.get('/notaries/:id/credentials', userController.getNotaryCredentials);
router.patch('/notaries/:id/credentials/:credentialId', userController.reviewCredential);

export const userRouter = router;
