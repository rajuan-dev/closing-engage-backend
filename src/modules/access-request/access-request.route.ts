import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/auth.middleware';
import * as accessRequestController from './access-request.controller';

const router = Router();

router.post('/company', accessRequestController.submitCompanyAccessRequest);
router.post('/notary', accessRequestController.submitNotaryAccessRequest);
router.get('/', requireAdminAuth, accessRequestController.getAccessRequests);
router.patch('/:id/status', requireAdminAuth, accessRequestController.patchAccessRequestStatus);

export const accessRequestRouter = router;
