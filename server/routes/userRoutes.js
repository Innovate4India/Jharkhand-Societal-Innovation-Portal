import express from 'express';
import { getUniversities } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/universities', authMiddleware, authorizeRoles('government'), getUniversities);

export default router;
