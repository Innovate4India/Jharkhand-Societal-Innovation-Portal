import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getMyRewards, redeemMyReward } from '../controllers/rewardController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/me', getMyRewards);
router.post('/redeem', redeemMyReward);

export default router;
