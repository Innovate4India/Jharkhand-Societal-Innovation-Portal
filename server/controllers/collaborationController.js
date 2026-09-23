import Collaboration from '../models/Collaboration.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// @desc    Create a new collaboration proposal
// @route   POST /api/collaborations
// @access  Private - Industry only
export const createCollaboration = async (req, res, next) => {
  try {
    const { project, collaborationType, proposal, fundingAmount } = req.body;

    // Validation
    if (!project || !collaborationType || !proposal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: project, collaborationType, and proposal'
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

    // Only industry users can create collaborations
    if (user.role !== 'industry') {
      return res.status(403).json({
        success: false,
        message: 'Only industry users can create collaboration proposals'
      });
    }

    // Validate collaboration type
    const validTypes = ['mentorship', 'funding', 'prototyping', 'technology', 'testing', 'deployment', 'technology_transfer', 'other'];
    if (!validTypes.includes(collaborationType)) {
      return res.status(400).json({
        success: false,
        message: `Collaboration type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Verify project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create collaboration object
    const collaborationObj = {
      project,
      industryPartner: userId,
      collaborationType,
      proposal,
      status: 'proposed'
    };

    // Add funding amount if provided
    if (fundingAmount && fundingAmount > 0) {
      collaborationObj.fundingAmount = fundingAmount;
    }

    // Create collaboration
    const collaboration = await Collaboration.create(collaborationObj);

    // Populate references
    await collaboration.populate([
      { path: 'project', select: 'title description university universityDepartment status' },
      { path: 'industryPartner', select: 'name email organizationName organizationType expertise' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Collaboration proposal created successfully',
      data: collaboration
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

// @desc    Get collaborations based on user role
// @route   GET /api/collaborations
// @access  Private
export const getCollaborations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { projectId, status } = req.query;

    // Get user to verify role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let filter = {};

    // Apply role-based filtering
    if (user.role === 'industry') {
      // Industry users see only their own collaboration proposals
      filter.industryPartner = userId;
    } else if (user.role === 'university') {
      // University users see collaborations for their own projects
      const userProjects = await Project.find({ university: userId });
      const projectIds = userProjects.map(p => p._id);
      filter.project = { $in: projectIds };
    }
    else if (user.role === 'government') {
      // Government monitors collaboration metadata, but citizens never reach this branch.
      filter = {};
    } else {
      return res.status(403).json({ success: false, message: 'This role cannot access collaboration records' });
    }

    // Apply additional filters
    if (projectId) {
      filter.project = projectId;
    }
    if (status) {
      filter.status = status;
    }

    // Get collaborations sorted by newest first
    const collaborations = await Collaboration.find(filter)
      .populate([
        { path: 'project', select: 'title description university universityDepartment status timeline' },
        { path: 'industryPartner', select: 'name email organizationName organizationType expertise' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: collaborations.length,
      data: collaborations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single collaboration by ID
// @route   GET /api/collaborations/:id
// @access  Private
export const getCollaborationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const collaboration = await Collaboration.findById(id)
      .populate([
        { path: 'project', select: 'title description university universityDepartment status' },
        { path: 'industryPartner', select: 'name email organizationName organizationType expertise' }
      ]);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    const user = await User.findById(req.user.id).select('role');
    const project = await Project.findById(collaboration.project).select('university');
    const canView = user?.role === 'government'
      || collaboration.industryPartner.toString() === req.user.id
      || project?.university.toString() === req.user.id;
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this collaboration'
      });
    }

    res.status(200).json({
      success: true,
      data: collaboration
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    next(error);
  }
};

// @desc    Update collaboration status
// @route   PATCH /api/collaborations/:id/status
// @access  Private - Project owner (university), industry partner, or government
export const updateCollaborationStatus = async (req, res, next) => {
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

    const validStatuses = ['proposed', 'under_review', 'accepted', 'rejected', 'active', 'completed'];
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

    // Find collaboration
    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    // Get the project to check university ownership
    const project = await Project.findById(collaboration.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Authorization check
    const isProjectOwner = project.university.toString() === userId;
    const isIndustryPartner = collaboration.industryPartner.toString() === userId;
    const isGovernment = user.role === 'government';

    // Project owner (university) can accept/reject
    // Industry can update status for their own proposals
    // Government can update any collaboration
    if (!isProjectOwner && !isIndustryPartner && !isGovernment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this collaboration status'
      });
    }

    // University project owner can decide (accept/reject)
    if (isProjectOwner && !isGovernment) {
      if (!['accepted', 'rejected', 'active', 'completed'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Universities can only update to: accepted, rejected, active, or completed'
        });
      }
    }

    // Industry partner can only update to under_review or provide progress updates
    if (isIndustryPartner && !isGovernment && !isProjectOwner) {
      if (!['proposed', 'active', 'completed'].includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Industry partners can only update to: proposed, active, or completed'
        });
      }
    }

    // Update collaboration
    const updatedCollaboration = await Collaboration.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate([
        { path: 'project', select: 'title description university universityDepartment' },
        { path: 'industryPartner', select: 'name email organizationName organizationType' }
      ]);

    res.status(200).json({
      success: true,
      message: 'Collaboration status updated successfully',
      data: updatedCollaboration
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    next(error);
  }
};

// @desc    Delete a collaboration
// @route   DELETE /api/collaborations/:id
// @access  Private - Industry partner, project owner (university), or government
export const deleteCollaboration = async (req, res, next) => {
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

    // Find collaboration
    const collaboration = await Collaboration.findById(id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    // Get the project to check university ownership
    const project = await Project.findById(collaboration.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found'
      });
    }

    // Authorization check
    const isProjectOwner = project.university.toString() === userId;
    const isIndustryPartner = collaboration.industryPartner.toString() === userId;
    const isGovernment = user.role === 'government';

    // Industry partner who created it, project-owning university, or government can delete
    if (!isProjectOwner && !isIndustryPartner && !isGovernment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this collaboration'
      });
    }

    // Delete collaboration
    await Collaboration.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Collaboration deleted successfully'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    next(error);
  }
};
