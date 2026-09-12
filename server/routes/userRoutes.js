import express from 'express';
import { getUniversities, getUniversityMembers, getUniversityParticipation } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/universities', authMiddleware, authorizeRoles('government'), getUniversities);
router.get('/university-participation', authMiddleware, authorizeRoles('government'), getUniversityParticipation);
router.get('/university-members', authMiddleware, authorizeRoles('university'), getUniversityMembers);

export default router;
