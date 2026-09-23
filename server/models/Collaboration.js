import mongoose from 'mongoose';

const collaborationSchema = new mongoose.Schema(
  {
    // Project reference
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required']
    },

    // Industry partner reference
    industryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Industry partner is required']
    },

    // Collaboration type
    collaborationType: {
      type: String,
      enum: {
        values: [
          'mentorship',
          'funding',
          'prototyping',
          'technology',
          'testing',
          'deployment',
          'technology_transfer',
          'other'
        ],
        message: 'Collaboration type must be one of the predefined values'
      },
      required: [true, 'Collaboration type is required']
    },

    // Proposal details
    proposal: {
      type: String,
      required: [true, 'Proposal description is required']
    },

    // Funding amount (optional)
    fundingAmount: {
      type: Number,
      default: null
    },

    // Status tracking
    status: {
      type: String,
      enum: {
        values: ['proposed', 'under_review', 'accepted', 'rejected', 'active', 'completed'],
        message: 'Status must be one of the predefined values'
      },
      default: 'proposed'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
collaborationSchema.index({ project: 1 });
collaborationSchema.index({ industryPartner: 1 });
collaborationSchema.index({ status: 1 });
collaborationSchema.index({ createdAt: -1 });
collaborationSchema.index({ project: 1, status: 1 });

const Collaboration = mongoose.model('Collaboration', collaborationSchema);

export default Collaboration;
