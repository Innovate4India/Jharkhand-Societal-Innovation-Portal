import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectStatus,
  updateProjectTeam,
  updateProjectFaculty,
  updateProjectPartners,
  deleteProject
} from '../controllers/projectController.js';

const router = express.Router();

// Protect all project routes with authentication
router.use(authMiddleware);

// Create a new project (universities only)
router.post('/', createProject);

// Get all projects
router.get('/', getAllProjects);

// Get a single project
router.get('/:id', getProjectById);

// Update project status (government or project-owning university)
router.patch('/:id/status', updateProjectStatus);

// Update project team members (project-owning university only)
router.patch('/:id/team', updateProjectTeam);

// Update the faculty mentor (project-owning university only)
router.patch('/:id/faculty', updateProjectFaculty);

// Update project industry partners (project-owning university or government)
router.patch('/:id/partners', updateProjectPartners);

// Delete a project (project-owning university or government)
router.delete('/:id', deleteProject);

export default router;
