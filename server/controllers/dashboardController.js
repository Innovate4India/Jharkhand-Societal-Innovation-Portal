import Challenge from '../models/Challenge.js';
import Project from '../models/Project.js';
import Collaboration from '../models/Collaboration.js';
import User from '../models/User.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const [
      totalChallenges,
      pendingChallenges,
      activeChallenges,
      resolvedChallenges,
      activeProjects,
      completedProjects,
      totalCollaborations,
      acceptedCollaborations,
      industryPartners,
      universitiesParticipating,
    ] = await Promise.all([
      Challenge.countDocuments(),
      Challenge.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
      Challenge.countDocuments({ status: { $in: ['assigned', 'in_progress'] } }),
      Challenge.countDocuments({ status: 'resolved' }),
      Project.countDocuments({ status: { $nin: ['completed', 'rejected'] } }),
      Project.countDocuments({ status: 'completed' }),
      Collaboration.countDocuments(),
      Collaboration.countDocuments({ status: 'accepted' }),
      User.countDocuments({ role: 'industry' }),
      Challenge.distinct('assignedUniversity').then((values) => values.filter(Boolean).length),
    ]);

    const recentChallenges = await Challenge.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'submittedBy', select: 'name email' })
      .lean();

    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({ path: 'university', select: 'name institution' })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalChallenges,
        pendingChallenges,
        activeChallenges,
        resolvedChallenges,
        activeProjects,
        completedProjects,
        totalCollaborations,
        acceptedCollaborations,
        industryPartners,
        universitiesParticipating,
        recentChallenges,
        recentProjects,
      },
    });
  } catch (error) {
    next(error);
  }
};
