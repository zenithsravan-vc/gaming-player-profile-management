import { Router } from 'express';
import { errorReportController } from '../controllers/errorReportController.js';

const router = Router();

router.post(
  '/error-reports',
  errorReportController.createReport
);

router.get(
  '/error-reports',
  errorReportController.getReports
);

export default router;