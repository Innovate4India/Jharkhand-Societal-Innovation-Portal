import Project from '../models/Project.js';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';

function governmentDistrict(user) {
  return String(user?.governmentDistrict || user?.district || '').trim();
}

// @desc    Create a new project proposal
// @route   POST /api/projects
// @access  Private - University only
export const createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      challenge,
      universityDepartment,
      facultyMentor,
      projectType,
      solutionSummary,
      objectives,
      expectedImpact,
      estimatedBudget,
      timeline
    } = req.body;

    // Validation
    if (!title || !description || !challenge || !universityDepartment || !projectType || !solutionSummary || !expectedImpact || !timeline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, challenge, universityDepartment, projectType, solutionSummary, expectedImpact, timeline'
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

    // Only university users can create projects
    if (user.role !== 'university') {
      return res.status(403).json({
        success: false,
        message: 'Only university users can create projects'
      });
    }

    if (facultyMentor) {
      const mentor = await User.findOne({
        _id: facultyMentor,
        role: 'university',
        accountType: 'faculty',
        institution: user.institution
      });
      if (!mentor) {
        return res.status(400).json({
          success: false,
          message: 'Faculty mentor must be a registered faculty member of your university'
        });
      }
    }

    // Validate challenge exists
    const challengeDoc = await Challenge.findById(challenge);
    if (!challengeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Verify that the authenticated university is assigned to this challenge
    if (!challengeDoc.assignedUniversity || challengeDoc.assignedUniversity.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only create projects for challenges assigned to your university'
      });
    }
    if (
      challengeDoc.assignmentStatus !== 'accepted'
      || !challengeDoc.acceptedByUniversity
      || challengeDoc.acceptedByUniversity.toString() !== userId
    ) {
      return res.status(400).json({
        success: false,
        message: 'The assigned university must accept the challenge before project creation'
      });
    }
    if (challengeDoc.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled challenges cannot have projects created'
      });
    }
    if (
      !['proposal_accepted', 'funded', 'accepted'].includes(challengeDoc.industryFundingStatus)
      || !challengeDoc.industryFundingAcceptedBy
      || challengeDoc.industryFundingAcceptedBy.toString() !== userId
    ) {
      return res.status(400).json({ success: false, message: 'University must accept the funding proposal and the actual funding must be recorded before project creation' });
    }

    // Validate project type
    const validProjectTypes = ['student_project', 'faculty_research', 'multidisciplinary_project', 'startup_prototype', 'research_project'];
    if (!validProjectTypes.includes(projectType)) {
      return res.status(400).json({
        success: false,
        message: `Project type must be one of: ${validProjectTypes.join(', ')}`
      });
    }

    // Validate timeline
    if (!timeline.startDate || !timeline.expectedCompletionDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and expectedCompletionDate are required in timeline'
      });
    }

    const startDate = new Date(timeline.startDate);
    const endDate = new Date(timeline.expectedCompletionDate);

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Expected completion date must be after start date'
      });
    }

    // Create project object
    const projectObj = {
      title,
      description,
      challenge,
      createdBy: userId,
      university: userId,
      universityDepartment,
      facultyMentor: facultyMentor || null,
      projectType,
      solutionSummary,
      expectedImpact,
      objectives: objectives || [],
      estimatedBudget: estimatedBudget || 0,
      timeline: {
        startDate,
        expectedCompletionDate: endDate
      },
      teamMembers: [userId], // Creator is added to team
      status: 'proposed'
    };

    // Create project
    const project = await Project.create(projectObj);

    // Populate references
    await project.populate([
      { path: 'createdBy', select: 'name email institution universityDepartment' },
      { path: 'university', select: 'name email institution universityDepartment' },
      { path: 'challenge', select: 'title category district status' },
      { path: 'teamMembers', select: 'name email institution universityDepartment accountType' },
      { path: 'facultyMentor', select: 'name email institution universityDepartment accountType' },
      { path: 'industryPartners', select: 'name email organizationName organizationType' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
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

// @desc    Get all projects with optional filters
// @route   GET /api/projects
// @access  Private
export const getAllProjects = async (req, res, next) => {
  try {
    if (req.user.role !== 'government' && req.user.role !== 'university') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to project management data'
      });
    }

    const { status, projectType, university, challenge } = req.query;

    // Build filter object
    const filter = {};
    let governmentChallengeIds = null;
    if (req.user.role === 'government') {
      const government = await User.findById(req.user.id).select('role district governmentDistrict');
      const district = governmentDistrict(government);
      if (!district) return res.status(403).json({ success: false, message: 'Government account requires district assignment' });
      governmentChallengeIds = await Challenge.find({ district }).distinct('_id');
      filter.challenge = { $in: governmentChallengeIds };
    }

    if (status) {
      filter.status = status;
    }
    if (projectType) {
      filter.projectType = projectType;
    }
    if (university) {
      filter.university = university;
    }
    if (challenge) {
      if (req.user.role === 'government' && !governmentChallengeIds.some((value) => value.toString() === challenge)) {
        return res.status(403).json({ success: false, message: 'You do not have access to projects outside your district' });
      }
      filter.challenge = challenge;
    }
    if (req.user.role === 'university') {
      filter.university = req.user.id;
    }

    // Get projects sorted by newest first
    const projects = await Project.find(filter)
      .populate([
        { path: 'createdBy', select: 'name email institution universityDepartment' },
        { path: 'university', select: 'name email institution universityDepartment' },
        { path: 'challenge', select: 'title category district status' },
        { path: 'teamMembers', select: 'name email institution universityDepartment' },
        { path: 'facultyMentor', select: 'name email institution universityDepartment accountType' },
        { path: 'industryPartners', select: 'name email organizationName organizationType' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate([
        { path: 'createdBy', select: 'name email institution universityDepartment' },
        { path: 'university', select: 'name email institution universityDepartment' },
        { path: 'challenge', select: 'title category district status description' },
        { path: 'teamMembers', select: 'name email institution universityDepartment accountType' },
        { path: 'facultyMentor', select: 'name email institution universityDepartment accountType' },
        { path: 'industryPartners', select: 'name email organizationName organizationType expertise' }
      ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (req.user.role === 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Citizens cannot access university project details'
      });
    }

    const projectUniversityId = typeof project.university === 'string'
      ? project.university
      : project.university?._id?.toString?.() || project.university?.toString?.();

    if (req.user.role === 'university' && projectUniversityId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    if (req.user.role === 'government') {
      const government = await User.findById(req.user.id).select('role district governmentDistrict');
      const district = governmentDistrict(government);
      if (!district || project.challenge?.district !== district) {
        return res.status(403).json({ success: false, message: 'You do not have access to projects outside your district' });
      }
    }

    if (req.user.role !== 'government' && req.user.role !== 'university') {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this project'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    next(error);
  }
};

// @desc    Update project status
// @route   PATCH /api/projects/:id/status
// @access  Private - Government or project-owning university
export const updateProjectStatus = async (req, res, next) => {
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

    const validStatuses = ['proposed', 'under_review', 'approved', 'prototype', 'testing', 'deployed', 'completed', 'rejected'];
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

    // Find project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (user.role === 'government') {
      const government = await User.findById(userId).select('role district governmentDistrict');
      const district = governmentDistrict(government);
      const challenge = await Challenge.findById(project.challenge).select('district');
      if (!district || challenge?.district !== district) {
        return res.status(403).json({ success: false, message: 'You cannot manage projects outside your district' });
      }
    }

    // Authorization check
    const isProjectOwner = project.university.toString() === userId;
    const isGovernment = user.role === 'government';

    // Government can change any status
    // University can only update progress-related statuses for their own projects
    if (!isGovernment && !isProjectOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this project status'
      });
    }

    // If university is updating, restrict to progress-related statuses
    if (isProjectOwner && !isGovernment) {
      if (['prototype', 'testing', 'deployed', 'completed'].includes(status)) {
        const challenge = await Challenge.findById(project.challenge).select('assignedUniversity assignmentStatus acceptedByUniversity cancelledAt industryFundingStatus industryFundingAcceptedBy');
        const executionAuthorized = challenge
          && challenge.assignedUniversity?.toString() === userId
          && challenge.assignmentStatus === 'accepted'
          && challenge.acceptedByUniversity?.toString() === userId
          && !challenge.cancelledAt
          && challenge.industryFundingStatus === 'accepted'
          && challenge.industryFundingAcceptedBy?.toString() === userId;
        if (!executionAuthorized) {
          return res.status(403).json({ success: false, message: 'Industry funding must be accepted by the University before project execution starts' });
        }
      }
      const progressStatuses = ['prototype', 'testing', 'deployed', 'completed'];
      if (!progressStatuses.includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Universities can only update to: prototype, testing, deployed, or completed'
        });
      }
      const allowedTransitions = {
        proposed: ['prototype'],
        prototype: ['testing'],
        testing: ['deployed', 'completed'],
        deployed: ['completed'],
        completed: ['completed']
      };
      if (!allowedTransitions[project.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change project status from ${project.status} to ${status}`
        });
      }
    }

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate([
        { path: 'createdBy', select: 'name email institution universityDepartment' },
        { path: 'university', select: 'name email institution universityDepartment' },
        { path: 'challenge', select: 'title category district status' },
        { path: 'teamMembers', select: 'name email' },
        { path: 'industryPartners', select: 'name email organizationName' }
      ]);

    if (status === 'completed') {
      await Challenge.findByIdAndUpdate(project.challenge, { status: 'resolved' });
    }

    res.status(200).json({
      success: true,
      message: 'Project status updated successfully',
      data: updatedProject
    });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    next(error);
  }
};

// @desc    Update project team members
// @route   PATCH /api/projects/:id/team
// @access  Private - Project-owning university only
export const updateProjectTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { teamMembers } = req.body;

    // Validation
    if (!Array.isArray(teamMembers)) {
      return res.status(400).json({
        success: false,
        message: 'teamMembers must be an array of user IDs'
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

    // Find project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Only project-owning university can manage team
    if (project.university.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the project-owning university can manage team members'
      });
    }

    // Verify all users exist
    const owner = await User.findById(userId).select('institution role');
    const users = await User.find({
      _id: { $in: teamMembers },
      role: 'university',
      institution: owner.institution
    });
    if (users.length !== teamMembers.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more team member IDs are invalid'
      });
    }

    // Update project team
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { teamMembers },
      { new: true, runValidators: true }
    )
      .populate([
        { path: 'createdBy', select: 'name email institution' },
        { path: 'university', select: 'name email institution' },
        { path: 'challenge', select: 'title category' },
        { path: 'teamMembers', select: 'name email institution accountType' },
        { path: 'industryPartners', select: 'name email organizationName' }
      ]);

    res.status(200).json({
      success: true,
      message: 'Project team updated successfully',
      data: updatedProject
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    next(error);
  }
};

// @desc    Update the faculty mentor for a project
// @route   PATCH /api/projects/:id/faculty
// @access  Private - Project-owning university only
export const updateProjectFaculty = async (req, res, next) => {
  try {
    const { facultyMentor } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'university') {
      return res.status(403).json({
        success: false,
        message: 'Only university users can assign a faculty mentor'
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    if (project.university.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the project-owning university can assign a faculty mentor'
      });
    }

    const mentor = await User.findOne({
      _id: facultyMentor,
      role: 'university',
      accountType: 'faculty',
      institution: user.institution
    });
    if (!mentor) {
      return res.status(400).json({
        success: false,
        message: 'Faculty mentor must be a registered faculty member of your university'
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      project._id,
      { facultyMentor: mentor._id },
      { new: true, runValidators: true }
    ).populate('facultyMentor', 'name email institution universityDepartment accountType');

    res.status(200).json({
      success: true,
      message: 'Faculty mentor assigned successfully',
      data: updatedProject
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Project or faculty mentor not found'
      });
    }
    next(error);
  }
};

// @desc    Update project industry partners
// @route   PATCH /api/projects/:id/partners
// @access  Private - Project-owning university or government
export const updateProjectPartners = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { industryPartners } = req.body;

    // Validation
    if (!Array.isArray(industryPartners)) {
      return res.status(400).json({
        success: false,
        message: 'industryPartners must be an array of user IDs'
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

    // Find project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Authorization check
    const isProjectOwner = project.university.toString() === userId;
    const isGovernment = user.role === 'government';

    if (!isProjectOwner && !isGovernment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to manage project partners'
      });
    }

    // Verify all partners exist and have industry role
    const partners = await User.find({ _id: { $in: industryPartners } });
    if (partners.length !== industryPartners.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more partner IDs are invalid'
      });
    }

    // Verify all partners have industry role
    const allIndustry = partners.every(p => p.role === 'industry');
    if (!allIndustry) {
      return res.status(400).json({
        success: false,
        message: 'All partners must have industry role'
      });
    }

    // Update project partners
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { industryPartners },
      { new: true, runValidators: true }
    )
      .populate([
        { path: 'createdBy', select: 'name email institution' },
        { path: 'university', select: 'name email institution' },
        { path: 'challenge', select: 'title category' },
        { path: 'teamMembers', select: 'name email' },
        { path: 'industryPartners', select: 'name email organizationName organizationType' }
      ]);

    res.status(200).json({
      success: true,
      message: 'Project partners updated successfully',
      data: updatedProject
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    next(error);
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private - Project-owning university or government
export const deleteProject = async (req, res, next) => {
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

    // Find project
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Authorization check
    const isProjectOwner = project.university.toString() === userId;
    const isGovernment = user.role === 'government';

    if (!isProjectOwner && !isGovernment) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this project'
      });
    }

    // Delete project
    await Project.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    next(error);
  }
};
