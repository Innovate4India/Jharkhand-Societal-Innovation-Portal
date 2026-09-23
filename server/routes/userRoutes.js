import express from 'express';
import { getUniversities, getUniversityMembers, getDepartmentMembers, getUniversityParticipation } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/universities', authMiddleware, authorizeRoles('government'), getUniversities);
router.get('/university-participation', authMiddleware, authorizeRoles('government'), getUniversityParticipation);
router.get('/university-members', authMiddleware, authorizeRoles('university'), getUniversityMembers);
router.get('/department-members', authMiddleware, authorizeRoles('university'), getDepartmentMembers);

export default router;
