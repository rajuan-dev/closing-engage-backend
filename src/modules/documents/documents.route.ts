import { Router } from 'express';

import { requireAnyAuth } from '../../middlewares/auth.middleware';
import * as documentController from './documents.controller';

const router = Router();

router.use(requireAnyAuth);

router.get('/', documentController.getDocuments);
router.post('/', documentController.postDocument);
router.patch('/:id/status', documentController.patchDocumentStatus);
router.post('/:id/versions', documentController.postDocumentVersion);
router.get('/:id/versions', documentController.getDocumentVersions);
router.post('/:id/restore-version', documentController.postRestoreDocumentVersion);
router.get('/:id/download-url', documentController.getDownloadUrl);
router.get('/:id/preview-url', documentController.getPreviewUrl);
router.get('/:id', documentController.getDocumentById);
router.delete('/:id', documentController.removeDocument);

export const documentRouter = router;
