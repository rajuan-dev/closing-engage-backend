import { Router } from 'express';
import * as teamController from './team.controller';

const router = Router();

router.get('/', teamController.getTeamMembers);
router.post('/', teamController.createTeamMember);
router.patch('/:email', teamController.updateTeamMember);
router.delete('/:email', teamController.deleteTeamMember);

export const teamRouter = router;
