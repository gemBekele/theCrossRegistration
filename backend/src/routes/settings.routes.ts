import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, getSettings);
router.patch('/', authenticate, updateSettings);

export default router;