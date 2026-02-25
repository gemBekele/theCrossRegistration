import { Router, RequestHandler } from 'express';
import { login, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router: Router = Router();

router.post('/login', authLimiter, login);
router.post('/change-password', authenticate, changePassword);

export default router;