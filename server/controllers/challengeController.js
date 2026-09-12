import Challenge from '../models/Challenge.js';
import User from '../models/User.js';

// @desc    Create a new challenge
// @route   POST /api/challenges
// @access  Private - Citizen only
export const createChallenge = async (req, res, next) => {
  try {
    const { title, description, category, district, villageOrCity, priority, location, media } = req.body;

    // Validation
    if (!title || !description || !category || !district || !villageOrCity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, district, villageOrCity'
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(', ')}`
      });
    }

    // Get user from auth middleware
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only citizens can submit challenges
    if (user.role !== 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Only citizens can submit challenges'
      });
    }

    // Create challenge object
    const challengeObj = {
      title,
      description,
      category,
      district,
      villageOrCity,
      ...(priority ? { priority } : {}),
      status: 'under_review',
      submittedBy: userId,
      media: media || { images: [], videos: [], documents: [] }
    };

    // Add location if provided
    if (location && location.latitude && location.longitude) {
      challengeObj.location = {
        latitude: location.latitude,
        longitude: location.longitude
      };
    }

    // Create challenge
    const challenge = await Challenge.create(challengeObj);

    // Populate submittedBy user details
    await challenge.populate({
      path: 'submittedBy',
      select: 'name email role district villageOrCity'
    });

    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: challenge
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    next(error);
  }
};

// @desc    Accept an assigned challenge
// @route   PATCH /api/challenges/:id/accept
// @access  Private - Assigned university only
export const acceptChallenge = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (!challenge.assignedUniversity || challenge.assignedUniversity.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned university can accept this challenge'
      });
    }

    if (!['submitted', 'under_review', 'assigned', 'funding_approved'].includes(challenge.status)) {
      return res.status(400).json({
        success: false,
        message: 'This challenge cannot be accepted in its current status'
      });
    }

    challenge.status = challenge.status === 'funding_approved' ? 'funding_approved' : 'assigned';
    await challenge.save();
    await challenge.populate([
      { path: 'submittedBy', select: 'name email role district villageOrCity' },
      { path: 'assignedUniversity', select: 'name email institution universityDepartment' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Challenge accepted successfully',
      data: challenge
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    next(error);
  }
};

// @desc    Get all challenges with optional filters
// @route   GET /api/challenges
// @access  Private
export const getAllChallenges = async (req, res, next) => {
  try {
    const { category, district, status, priority } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (district) {
      filter.district = district;
    }
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (req.user.role === 'university') {
      filter.assignedUniversity = req.user.id;
    } else if (req.user.role === 'citizen') {
      filter.submittedBy = req.user.id;
    }

    // Get challenges sorted by newest first
    const challenges = await Challenge.find(filter)
      .populate({
        path: 'submittedBy',
        select: 'name email role district villageOrCity'
      })
      .populate({
        path: 'assignedUniversity',
        select: 'name email institution institution universityDepartment'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: challenges.length,
      data: challenges
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single challenge by ID
// @route   GET /api/challenges/:id
// @access  Private
export const getChallengeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const challenge = await Challenge.findById(id)
      .populate({
        path: 'submittedBy',
        select: 'name email role district villageOrCity'
      })
      .populate({
        path: 'assignedUniversity',
        select: 'name email institution universityDepartment'
      });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (req.user.role === 'university' && (!challenge.assignedUniversity || challenge.assignedUniversity._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this challenge'
      });
    }
    if (req.user.role === 'citizen' && challenge.submittedBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this challenge'
      });
    }

    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    next(error);
  }
};

// @desc    Update challenge status
// @route   PATCH /api/challenges/:id/status
// @access  Private - Government only
export const updateChallengeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['submitted', 'under_review', 'approved', 'assigned', 'funding_approved', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get user from auth middleware
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only government users can update status
    if (user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: 'Only government users can update challenge status'
      });
    }

    const existingChallenge = await Challenge.findById(id).select('status');
    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    const allowedTransitions = {
      submitted: ['under_review'],
      under_review: ['approved', 'rejected'],
      approved: ['approved'],
      assigned: ['assigned'],
      funding_approved: ['funding_approved'],
      in_progress: ['in_progress'],
      resolved: ['resolved'],
      rejected: ['rejected']
    };
    if (!allowedTransitions[existingChallenge.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change challenge status from ${existingChallenge.status} to ${status}`
      });
    }

    // Find and update challenge
    const challenge = await Challenge.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'submittedBy',
        select: 'name email role district villageOrCity'
      })
      .populate({
        path: 'assignedUniversity',
        select: 'name email institution universityDepartment'
      });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge status updated successfully',
      data: challenge
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    next(error);
  }
};

// @desc    Update challenge priority
// @route   PATCH /api/challenges/:id/priority
// @access  Private - Government only
export const updateChallengePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    // Validation
    if (!priority) {
      return res.status(400).json({
        success: false,
        message: 'Priority is required'
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(', ')}`
      });
    }

    // Get user from auth middleware
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only government users can update priority
    if (user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: 'Only government users can update challenge priority'
      });
    }

    const existingChallenge = await Challenge.findById(id).select('status');
    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Find and update challenge
    const challenge = await Challenge.findByIdAndUpdate(
      id,
      { priority },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'submittedBy',
        select: 'name email role district villageOrCity'
      })
      .populate({
        path: 'assignedUniversity',
        select: 'name email institution universityDepartment'
      });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge priority updated successfully',
      data: challenge
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    next(error);
  }
};

// @desc    Assign challenge to a university
// @route   PATCH /api/challenges/:id/assign
// @access  Private - Government only
export const assignChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedUniversity } = req.body;

    // Validation
    if (!assignedUniversity) {
      return res.status(400).json({
        success: false,
        message: 'assignedUniversity user ID is required'
      });
    }

    // Get user from auth middleware
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only government users can assign challenges
    if (user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: 'Only government users can assign challenges'
      });
    }

    // Verify that the assigned user is a university user
    const universityUser = await User.findById(assignedUniversity);

    if (!universityUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned university user not found'
      });
    }

    if (universityUser.role !== 'university') {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must have university role'
      });
    }

    const existingChallenge = await Challenge.findById(id).select('status');
    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    if (existingChallenge.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved challenges can be assigned to a university'
      });
    }

    // Find and update challenge
    const challenge = await Challenge.findByIdAndUpdate(
      id,
      { assignedUniversity, status: 'assigned' },
      { new: true, runValidators: true }
    )
      .populate({
        path: 'submittedBy',
        select: 'name email role district villageOrCity'
      })
      .populate({
        path: 'assignedUniversity',
        select: 'name email institution universityDepartment'
      });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Challenge assigned successfully',
      data: challenge
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Challenge or user not found'
      });
    }

    next(error);
  }
};

// @desc    Approve government funding for an assigned challenge
// @route   PATCH /api/challenges/:id/funding
// @access  Private - Government only
export const approveChallengeFunding = async (req, res, next) => {
  try {
    const { fundingAmount } = req.body;
    const amount = Number(fundingAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A positive funding amount is required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    if (user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: 'Only government users can approve challenge funding'
      });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    if (challenge.status !== 'assigned' || !challenge.assignedUniversity) {
      return res.status(400).json({
        success: false,
        message: 'Only challenges assigned to a university can receive funding approval'
      });
    }

    challenge.fundingAmount = amount;
    challenge.fundingStatus = 'approved';
    challenge.fundingApprovedBy = user._id;
    challenge.fundingApprovedAt = new Date();
    challenge.status = 'funding_approved';
    await challenge.save();
    await challenge.populate([
      { path: 'submittedBy', select: 'name email role district villageOrCity' },
      { path: 'assignedUniversity', select: 'name email institution universityDepartment' },
      { path: 'fundingApprovedBy', select: 'name email role' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Government funding approved successfully',
      data: challenge
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    next(error);
  }
};

// @desc    Delete a challenge
// @route   DELETE /api/challenges/:id
// @access  Private - Citizen (own challenge) or Government
export const deleteChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get user from auth middleware
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find challenge
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Check authorization
    const isChallengeOwner = challenge.submittedBy.toString() === userId;
    const isGovernment = user.role === 'government';

    if (!isChallengeOwner && !isGovernment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this challenge'
      });
    }

    // Delete challenge
    await Challenge.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Challenge deleted successfully'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    next(error);
  }
};
