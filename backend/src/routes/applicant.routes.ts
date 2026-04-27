import { Router } from 'express';
import {
  getApplicants,
  getApplicantById,
  updateApplicantStatus,
  getStats,
  exportApplicants,
  serveFile,
  sendMessageByStatus
} from '../controllers/applicant.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, getApplicants);
router.get('/stats', authenticate, getStats);
router.post('/message-by-status', authenticate, sendMessageByStatus);
router.get('/export', authenticate, exportApplicants);
router.get('/file/:folder/:filename', authenticate, serveFile);
router.get('/:id', authenticate, getApplicantById);
router.patch('/:id/status', authenticate, updateApplicantStatus);

export default router;