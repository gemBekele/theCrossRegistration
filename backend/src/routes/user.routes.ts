import { Router } from 'express';
import { getUsers, createUser, deleteUser, resendInvitation } from '../controllers/user.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, requireSuperAdmin, getUsers);
router.post('/', authenticate, requireSuperAdmin, createUser);
router.delete('/:id', authenticate, requireSuperAdmin, deleteUser);
router.post('/:id/resend', authenticate, requireSuperAdmin, resendInvitation);

export default router;