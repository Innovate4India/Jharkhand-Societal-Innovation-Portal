import mongoose from 'mongoose';

const sponsorshipSchema = new mongoose.Schema({
  industry: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  amount: { type: Number, required: true, min: [1, 'Sponsorship amount must be positive'] },
  expertise: { type: String, trim: true, maxlength: 2000, default: '' },
  notes: { type: String, trim: true, maxlength: 2000, default: '' },
  contactPerson: { type: String, trim: true, maxlength: 200, default: '' },
  contactEmail: { type: String, trim: true, maxlength: 320, default: '' },
  contactPhone: { type: String, trim: true, maxlength: 30, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'accepted', 'rejected', 'funded'], default: 'pending' },
  approvedAt: { type: Date, default: null }
}, { timestamps: true });

// One active sponsor per project keeps funding ownership unambiguous.
sponsorshipSchema.index({ challenge: 1, status: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['pending', 'approved', 'accepted', 'funded'] } } });
sponsorshipSchema.index({ industry: 1, createdAt: -1 });

export default mongoose.model('Sponsorship', sponsorshipSchema);
