import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    // Basic information
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Challenge description is required']
    },
    category: {
      type: String,
      enum: {
        values: [
          'Education',
          'Healthcare',
          'Agriculture',
          'Water',
          'Sanitation',
          'Environment',
          'Energy',
          'Rural Livelihood',
          'Accessibility',
          'Urban Infrastructure',
          'Public Administration',
          'Other'
        ],
        message: 'Category must be one of the predefined categories'
      },
      required: [true, 'Category is required']
    },

    // Location
    district: {
      type: String,
      required: [true, 'District is required']
    },
    villageOrCity: {
      type: String,
      required: [true, 'Village or City is required']
    },
    location: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    },

    // User reference
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Challenge must be submitted by a user']
    },
    citizenContactNumber: {
      type: String,
      select: false,
      match: [/^[6-9]\d{9}$/, 'Contact number must be a valid 10-digit Indian mobile number']
    },

    // Status tracking
    status: {
      type: String,
      enum: {
        values: [
          'submitted',
          'under_review',
          'approved',
          'assigned',
          'accepted',
          'funding_approved',
          'in_progress',
          'resolved',
          'rejected'
        ],
        message: 'Status must be one of the predefined values'
      },
      default: 'submitted'
    },

    // Priority level
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Priority must be one of: low, medium, high, critical'
      },
      default: 'medium'
    },

    // Media attachments
    media: {
      images: [
        {
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      videos: [
        {
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      documents: [
        {
          url: String,
          fileName: String,
          uploadedAt: {
            type: Date,
            default: Date.now
          }
        }
      ]
    },

    attachments: [
      {
        originalName: {
          type: String,
          required: true,
          trim: true
        },
        storedName: {
          type: String,
          required: true,
          select: false
        },
        mimeType: {
          type: String,
          required: true
        },
        size: {
          type: Number,
          required: true,
          min: 1
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // AI Analysis (optional - for future implementation)
    aiAnalysis: {
      category: String,
      priority: String,
      summary: String,
      duplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        default: null
      },
      analyzedAt: Date
    },

    // University assignment (optional)
    assignedUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignmentStatus: {
      type: String,
      enum: ['unassigned', 'awaiting_acceptance', 'accepted'],
      default: 'unassigned'
    },
    acceptedByUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    acceptedAt: {
      type: Date,
      default: null
    },

    // Government funding approval
    fundingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Funding amount cannot be negative']
    },
    fundingStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved'],
        message: 'Funding status must be pending or approved'
      },
      default: 'pending'
    },
    fundingApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    fundingApprovedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for common queries
challengeSchema.index({ district: 1, category: 1 });
challengeSchema.index({ status: 1 });
challengeSchema.index({ submittedBy: 1 });
challengeSchema.index({ createdAt: -1 });

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
