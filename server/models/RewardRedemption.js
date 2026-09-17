import mongoose from 'mongoose';

const rewardRedemptionSchema = new mongoose.Schema({
  citizen: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokensRedeemed: { type: Number, required: true, min: 50 },
  rewardAmount: { type: Number, required: true, min: 500 },
  status: { type: String, enum: ['demo_redeemed'], default: 'demo_redeemed' },
  rewardType: { type: String, enum: ['impact_tokens'], default: 'impact_tokens' },
  redeemedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('RewardRedemption', rewardRedemptionSchema);
