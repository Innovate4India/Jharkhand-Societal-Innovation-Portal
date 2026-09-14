import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    // Basic information
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Project description is required']
    },

    // Challenge reference
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: [true, 'Challenge reference is required']
    },

    // Creator and university
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project creator is required']
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'University is required']
    },
    universityDepartment: {
      type: String,
      required: [true, 'University department is required']
    },
    facultyMentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Project type
    projectType: {
      type: String,
      enum: {
        values: ['student_project', 'faculty_research', 'multidisciplinary_project', 'startup_prototype', 'research_project'],
        message: 'Project type must be one of: student_project, faculty_research, multidisciplinary_project, startup_prototype, research_project'
      },
      required: [true, 'Project type is required']
    },

    // Status tracking
    status: {
      type: String,
      enum: {
        values: ['proposed', 'under_review', 'approved', 'prototype', 'testing', 'deployed', 'completed', 'rejected'],
        message: 'Status must be one of the predefined values'
      },
      default: 'proposed'
    },

    // Team members
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Solution details
    solutionSummary: {
      type: String,
      required: [true, 'Solution summary is required']
    },
    objectives: [
      {
        type: String
      }
    ],

    // Impact and budget
    expectedImpact: {
      type: String,
      required: [true, 'Expected impact is required']
    },
    estimatedBudget: {
      type: Number,
      default: 0
    },

    // Timeline
    timeline: {
      startDate: {
        type: Date,
        required: [true, 'Start date is required']
      },
      expectedCompletionDate: {
        type: Date,
        required: [true, 'Expected completion date is required']
      }
    },

    // Industry partners
    industryPartners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
projectSchema.index({ challenge: 1 });
projectSchema.index({ university: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
