import Challenge from '../models/Challenge.js';
import Project from '../models/Project.js';
import Collaboration from '../models/Collaboration.js';
import User from '../models/User.js';
import Sponsorship from '../models/Sponsorship.js';

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

export const getGovernmentAnalytics = async (req, res, next) => {
  try {
    const [
      challengeTotal,
      challengeStatuses,
      sponsorshipStatuses,
      projectTotal,
      projectStatuses,
      universityTotal,
      assignedUniversities,
      activeProjectUniversities,
      studentCount,
      facultyCount,
    ] = await Promise.all([
      Challenge.countDocuments(),
      Challenge.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Sponsorship.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
      Project.countDocuments(),
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.countDocuments({ role: 'university' }),
      Challenge.distinct('assignedUniversity', { assignedUniversity: { $ne: null } }),
      Project.distinct('university', { status: { $nin: ['completed', 'rejected'] } }),
      Project.distinct('teamMembers', { teamMembers: { $exists: true, $ne: [] } }),
      Project.distinct('facultyMentor', { facultyMentor: { $ne: null } }),
    ]);

    const countBy = (rows, key) => rows.find((row) => row._id === key)?.count || 0;
    const approvedSponsorships = sponsorshipStatuses.find((row) => row._id === 'approved') || { count: 0, amount: 0 };
    res.status(200).json({
      success: true,
      data: {
        challenges: {
          total: challengeTotal,
          underReview: countBy(challengeStatuses, 'under_review'),
          approved: countBy(challengeStatuses, 'approved'),
          assigned: countBy(challengeStatuses, 'assigned'),
          fundingApproved: countBy(challengeStatuses, 'funding_approved'),
          inProgress: countBy(challengeStatuses, 'in_progress'),
          resolved: countBy(challengeStatuses, 'resolved'),
        },
        projects: {
          total: projectTotal,
          proposed: countBy(projectStatuses, 'proposed'),
          prototype: countBy(projectStatuses, 'prototype'),
          testing: countBy(projectStatuses, 'testing'),
          deployed: countBy(projectStatuses, 'deployed'),
          completed: countBy(projectStatuses, 'completed'),
        },
        universities: {
          total: universityTotal,
          withAssignedChallenges: assignedUniversities.length,
          withActiveProjects: activeProjectUniversities.length,
        },
        impact: {
          solutionsDeployed: countBy(projectStatuses, 'deployed') + countBy(projectStatuses, 'completed'),
          communitiesResolved: countBy(challengeStatuses, 'resolved'),
          studentsInvolved: studentCount.length,
          facultyMentors: facultyCount.length,
        },
        funding: {
          approvedAmount: approvedSponsorships.amount || 0,
          fundedCount: approvedSponsorships.count || 0,
          sponsorship: Object.fromEntries(sponsorshipStatuses.map((row) => [row._id, { count: row.count, amount: row.amount || 0 }])),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
