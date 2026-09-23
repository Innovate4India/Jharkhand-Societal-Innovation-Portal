import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProjectStatus,
  updateProjectProgress,
  updateProjectTeam,
  updateProjectSolution,
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
router.patch('/:id/progress', authorizeRoles('university'), updateProjectProgress);

// Update project team members (project-owning university only)
router.patch('/:id/team', authorizeRoles('university'), updateProjectTeam);
router.patch('/:id/solution', authorizeRoles('university'), updateProjectSolution);

// Update the faculty mentor (project-owning university only)
router.patch('/:id/faculty', authorizeRoles('university'), updateProjectFaculty);

// Update project industry partners (project-owning university or government)
router.patch('/:id/partners', updateProjectPartners);

// Delete a project (project-owning university or government)
router.delete('/:id', deleteProject);

export default router;
