import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { searchPortal } from '../controllers/searchController.js';

const router = express.Router();
router.get('/', authMiddleware, searchPortal);
export default router;
