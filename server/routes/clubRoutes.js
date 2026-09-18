import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getClubMembers, getClubActivities, createClubActivity, updateClubActivity, registerForClubActivity } from '../controllers/clubController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/:club/members', getClubMembers);
router.get('/:club/activities', getClubActivities);
router.post('/:club/activities', createClubActivity);
router.patch('/:club/activities/:id', updateClubActivity);
router.post('/:club/activities/:id/register', registerForClubActivity);
export default router;
