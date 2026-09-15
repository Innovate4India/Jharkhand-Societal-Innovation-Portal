import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  getOpportunities, getIndustryProject, createSponsorship,
  getSponsorships, getSponsorship, updateSponsorship, acceptSponsorship, getUniversitySponsorships
} from '../controllers/industryController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/university-sponsorships', authorizeRoles('university'), getUniversitySponsorships);
router.patch('/challenges/:id/funding/accept', authorizeRoles('university'), acceptSponsorship);
router.use(authorizeRoles('industry'));
router.get('/opportunities', getOpportunities);
router.get('/projects/:id', getIndustryProject);
router.post('/sponsorships', createSponsorship);
router.get('/sponsorships', getSponsorships);
router.get('/sponsorships/:id', getSponsorship);
router.patch('/sponsorships/:id', updateSponsorship);
export default router;
