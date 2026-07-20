import { Router } from 'express';

import * as contactController from './contact.controller';

const router = Router();

router.post('/', contactController.submitContactMessage);

export const contactRouter = router;
