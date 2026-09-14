import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { getGovernmentAnalytics } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/analytics', authMiddleware, authorizeRoles('government'), getGovernmentAnalytics);

export default router;
