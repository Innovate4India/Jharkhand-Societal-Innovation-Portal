import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import {
  createCollaboration,
  getCollaborations,
  getCollaborationById,
  updateCollaborationStatus,
  deleteCollaboration
} from '../controllers/collaborationController.js';

const router = express.Router();

// Protect all collaboration routes with authentication
router.use(authMiddleware);

// Create a new collaboration proposal (industry only)
router.post('/', createCollaboration);

// Get collaborations (role-based filtering)
router.get('/', getCollaborations);

// Get a single collaboration
router.get('/:id', getCollaborationById);

// Update collaboration status (project owner, industry partner, or government)
router.patch('/:id/status', updateCollaborationStatus);

// Delete a collaboration (industry partner, project owner, or government)
router.delete('/:id', deleteCollaboration);

export default router;
