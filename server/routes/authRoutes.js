import express from 'express';
import { registerUser, loginUser, getCurrentUser, updateUniversityProfile, getUniversityInstitutions, generateUniversityCoordinatorCode } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/universities', getUniversityInstitutions);
router.post('/university-coordinator/generate-code', generateUniversityCoordinatorCode);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.patch('/university-profile', authMiddleware, updateUniversityProfile);

export default router;
