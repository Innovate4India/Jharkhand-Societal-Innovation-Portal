import mongoose from 'mongoose';
import User from '../models/User.js';
import RewardRedemption from '../models/RewardRedemption.js';

function rewardSummary(user) {
  const impactTokens = user.impactTokens || 0;
  const redeemableBlocks = Math.floor(impactTokens / 50);
  return {
    impactTokens,
    lifetimeImpactTokens: user.lifetimeImpactTokens || 0,
    totalVerifiedProblems: user.totalVerifiedProblems || 0,
    totalRewardsRedeemed: user.totalRewardsRedeemed || 0,
    totalRewardAmountRedeemed: user.totalRewardAmountRedeemed || 0,
    virtualCashBalance: user.virtualCashBalance || 0,
    redeemableBlocks,
    rewardAmount: redeemableBlocks * 500,
    nextRewardTokens: impactTokens % 50,
  };
}

export const getMyRewards = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user.id, role: 'citizen' });
    if (!user) return res.status(403).json({ success: false, message: 'Only citizens can access impact rewards' });
    const history = await RewardRedemption.find({ citizen: user._id }).sort({ redeemedAt: -1 }).lean();
    return res.json({ success: true, data: { summary: rewardSummary(user), history } });
  } catch (error) {
    return next(error);
  }
};

export const redeemMyReward = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const user = await User.findOne({ _id: req.user.id, role: 'citizen' }).session(session);
      if (!user) {
        const error = new Error('Only citizens can redeem impact rewards');
        error.statusCode = 403;
        throw error;
      }
      const redeemableBlocks = Math.floor((user.impactTokens || 0) / 50);
      if (!redeemableBlocks) {
        const error = new Error('At least 50 Impact Tokens are required to redeem a reward');
        error.statusCode = 400;
        throw error;
      }
      const tokensRedeemed = redeemableBlocks * 50;
      const rewardAmount = redeemableBlocks * 500;
      await User.updateOne(
        { _id: user._id, impactTokens: { $gte: tokensRedeemed } },
        { $inc: { impactTokens: -tokensRedeemed, totalRewardsRedeemed: 1, totalRewardAmountRedeemed: rewardAmount, virtualCashBalance: rewardAmount } },
        { session }
      );
      const [redemption] = await RewardRedemption.create([{
        citizen: user._id,
        tokensRedeemed,
        rewardAmount,
        status: 'demo_redeemed',
        rewardType: 'impact_tokens'
      }], { session });
      result = { redemption, summary: rewardSummary({ ...user.toObject(), impactTokens: user.impactTokens - tokensRedeemed, totalRewardsRedeemed: (user.totalRewardsRedeemed || 0) + 1, totalRewardAmountRedeemed: (user.totalRewardAmountRedeemed || 0) + rewardAmount, virtualCashBalance: (user.virtualCashBalance || 0) + rewardAmount }) };
    });
    return res.status(201).json({ success: true, message: 'Virtual Cash Reward redeemed. No real bank or UPI transfer was made.', data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    if (/transaction|replica set|mongos/i.test(error.message || '')) {
      try {
        const user = await User.findOne({ _id: req.user.id, role: 'citizen' });
        if (!user) return res.status(403).json({ success: false, message: 'Only citizens can redeem impact rewards' });
        const redeemableBlocks = Math.floor((user.impactTokens || 0) / 50);
        if (!redeemableBlocks) return res.status(400).json({ success: false, message: 'At least 50 Impact Tokens are required to redeem a reward' });
        const tokensRedeemed = redeemableBlocks * 50;
        const rewardAmount = redeemableBlocks * 500;
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id, role: 'citizen', impactTokens: { $gte: tokensRedeemed } },
          { $inc: { impactTokens: -tokensRedeemed, totalRewardsRedeemed: 1, totalRewardAmountRedeemed: rewardAmount, virtualCashBalance: rewardAmount } },
          { new: true }
        );
        if (!updatedUser) return res.status(409).json({ success: false, message: 'Reward balance changed. Please try again.' });
        try {
          const redemption = await RewardRedemption.create({ citizen: user._id, tokensRedeemed, rewardAmount, status: 'demo_redeemed', rewardType: 'impact_tokens' });
          return res.status(201).json({ success: true, message: 'Virtual Cash Reward redeemed. No real bank or UPI transfer was made.', data: { redemption, summary: rewardSummary(updatedUser) } });
        } catch (createError) {
          await User.updateOne({ _id: user._id }, { $inc: { impactTokens: tokensRedeemed, totalRewardsRedeemed: -1, totalRewardAmountRedeemed: -rewardAmount, virtualCashBalance: -rewardAmount } });
          throw createError;
        }
      } catch (fallbackError) {
        return next(fallbackError);
      }
    }
    return next(error);
  } finally {
    await session.endSession();
  }
};
