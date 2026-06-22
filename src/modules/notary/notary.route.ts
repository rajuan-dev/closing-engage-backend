import { Router } from 'express';

import { requireNotaryAuth } from '../../middlewares/auth.middleware';
import { addCredential, getCredentials, updateCommission } from './notary-credentials.controller';

const router = Router();

router.get('/credentials', requireNotaryAuth, getCredentials);
router.patch('/credentials', requireNotaryAuth, updateCommission);
router.post('/credentials', requireNotaryAuth, addCredential);

export const notaryRouter = router;
