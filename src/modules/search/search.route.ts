import { Router } from 'express';

import { requireAdminAuth } from '../../middlewares/auth.middleware';
import * as searchController from './search.controller';

const router = Router();

router.use(requireAdminAuth);

router.get('/', searchController.getSearchResults);

export const searchRouter = router;
