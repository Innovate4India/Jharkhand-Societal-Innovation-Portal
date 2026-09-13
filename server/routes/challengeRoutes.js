import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { parseChallengeUpload } from '../middleware/challengeUpload.js';
import {
  createChallenge,
  acceptChallenge,
  getAllChallenges,
  getChallengeById,
  updateChallengeStatus,
  updateChallengePriority,
  assignChallenge,
  cancelChallenge,
  approveChallengeFunding,
  deleteChallenge,
  downloadChallengeAttachment
} from '../controllers/challengeController.js';

const router = express.Router();

// Protect all challenge routes with authentication
router.use(authMiddleware);

// Create a new challenge (citizens only)
router.post('/', parseChallengeUpload, createChallenge);

// Accept an assigned challenge (university only)
router.patch('/:id/accept', authorizeRoles('university'), acceptChallenge);

// Get all challenges
router.get('/', getAllChallenges);

// Get a single challenge
router.get('/:id', getChallengeById);
router.get('/:id/attachments/:attachmentId', downloadChallengeAttachment);

// Update challenge status (government only)
router.patch('/:id/status', authorizeRoles('government'), updateChallengeStatus);

// Update challenge priority (government only)
router.patch('/:id/priority', authorizeRoles('government'), updateChallengePriority);

// Assign challenge to university (government only)
router.patch('/:id/assign', authorizeRoles('government'), assignChallenge);

// Cancel an assigned challenge before funding (government only)
router.patch('/:id/cancel', authorizeRoles('government'), cancelChallenge);

// Approve government funding (government only)
router.patch('/:id/funding', authorizeRoles('government'), approveChallengeFunding);

// Delete a challenge (challenge owner or government)
router.delete('/:id', deleteChallenge);

export default router;
