import mongoose from 'mongoose';
import Challenge from '../models/Challenge.js';
import Project from '../models/Project.js';
import Sponsorship from '../models/Sponsorship.js';

const opportunityFilter = {
  status: { $in: ['approved', 'assigned', 'accepted', 'funding_approved', 'in_progress'] },
  assignmentStatus: 'accepted',
  assignedUniversity: { $ne: null },
  cancelledAt: null,
  industryFundingStatus: { $in: ['eligible', 'pending'] }
};

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const getOpportunities = async (req, res, next) => {
  try {
    const challenges = await Challenge.find(opportunityFilter)
      .populate('assignedUniversity', 'name institution universityDepartment')
      .populate('acceptedByUniversity', 'name institution universityDepartment')
      .sort({ createdAt: -1 });
    const projects = await Project.find({ challenge: { $in: challenges.map((challenge) => challenge._id) } })
      .populate('university', 'name institution universityDepartment');
    const eligible = challenges.map((challenge) => {
      const project = projects.find((candidate) => candidate.challenge.toString() === challenge._id.toString());
      return {
        _id: challenge._id,
        title: project?.title || challenge.title,
        description: project?.description || challenge.description,
        solutionSummary: project?.solutionSummary || '',
        estimatedBudget: project?.estimatedBudget || 0,
        status: project?.status || 'proposal_pending',
        university: project?.university || challenge.assignedUniversity,
        challenge,
        project
      };
    });
    res.json({ success: true, count: eligible.length, data: eligible });
  } catch (error) { next(error); }
};

export const getIndustryProject = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Project not found' });
    const project = await Project.findById(req.params.id)
      .populate({ path: 'challenge', match: opportunityFilter, select: 'title description category district priority status assignmentStatus assignedUniversity cancelledAt' })
      .populate('university', 'name institution universityDepartment');
    if (!project || !project.challenge) return res.status(404).json({ success: false, message: 'Opportunity is not eligible' });
    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

export const createSponsorship = async (req, res, next) => {
  try {
    const { project: projectId, challenge: challengeId, amount, expertise = '', notes = '', contactPerson = '', contactEmail = '', contactPhone = '' } = req.body;
    const numericAmount = Number(amount);
    if ((!validId(projectId) && !validId(challengeId)) || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid project and positive funding amount are required' });
    }
    if (typeof contactPerson !== 'string' || typeof contactEmail !== 'string' || typeof contactPhone !== 'string'
      || !contactPerson.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || !/^[6-9]\d{9}$/.test(contactPhone)) {
      return res.status(400).json({ success: false, message: 'Valid contact person, email, and Indian phone number are required' });
    }
    const project = validId(projectId) ? await Project.findById(projectId).populate('challenge') : null;
    const challenge = project?.challenge || await Challenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ success: false, message: 'Eligible problem not found' });
    if (!['approved', 'assigned', 'accepted', 'funding_approved', 'in_progress'].includes(challenge.status)
      || challenge.assignmentStatus !== 'accepted' || !challenge.assignedUniversity || challenge.cancelledAt) {
      return res.status(400).json({ success: false, message: 'Only verified, university-accepted, non-cancelled projects can be sponsored' });
    }
    const existing = await Sponsorship.findOne({ challenge: challenge._id, status: { $in: ['pending', 'approved', 'accepted'] } });
    if (existing) return res.status(409).json({ success: false, message: 'This project already has an active sponsorship' });
    const sponsorship = await Sponsorship.create({
      industry: req.user.id, project: project?._id || null, challenge: challenge._id,
      amount: numericAmount, expertise, notes, contactPerson, contactEmail, contactPhone, status: 'pending'
    });
    const now = new Date();
    await Challenge.findByIdAndUpdate(challenge._id, {
      industryFundingStatus: 'funded_pending_university_acceptance',
      industryFundedBy: req.user.id, industryFundingAmount: numericAmount, industryFundingAt: now,
      industryFundingContactPerson: contactPerson, industryFundingContactEmail: contactEmail,
      industryFundingContactPhone: contactPhone, industryFundingMessage: notes
    });
    if (project) await Project.findByIdAndUpdate(project._id, { $addToSet: { industryPartners: req.user.id } });
    await sponsorship.populate([
      { path: 'project', select: 'title description status estimatedBudget university universityDepartment' },
      { path: 'challenge', select: 'title category district priority status' }
    ]);
    res.status(201).json({ success: true, message: 'Industry sponsorship submitted for university acceptance', data: sponsorship });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'This project already has an active sponsorship' });
    next(error);
  }
};

export const acceptSponsorship = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Challenge not found' });
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge || challenge.assignedUniversity?.toString() !== req.user.id || challenge.assignmentStatus !== 'accepted') {
      return res.status(403).json({ success: false, message: 'Only the assigned university can accept this sponsorship' });
    }
    const sponsorship = await Sponsorship.findOne({ challenge: challenge._id, status: 'pending' });
    if (!sponsorship) return res.status(404).json({ success: false, message: 'No pending sponsorship found' });
    sponsorship.status = 'accepted';
    sponsorship.approvedAt = new Date();
    await sponsorship.save();
    challenge.industryFundingStatus = 'accepted';
    challenge.industryFundingAcceptedBy = req.user.id;
    challenge.industryFundingAcceptedAt = sponsorship.approvedAt;
    challenge.fundingStatus = 'approved';
    challenge.fundingAmount = sponsorship.amount;
    challenge.fundingApprovedAt = sponsorship.approvedAt;
    challenge.status = 'funding_approved';
    await challenge.save();
    if (sponsorship.project) await Project.findByIdAndUpdate(sponsorship.project, { $addToSet: { industryPartners: sponsorship.industry } });
    res.json({ success: true, message: 'Industry sponsorship accepted', data: challenge });
  } catch (error) { next(error); }
};

export const getUniversitySponsorships = async (req, res, next) => {
  try {
    const projects = await Project.find({ university: req.user.id }).select('_id challenge');
    const challenges = await Challenge.find({ assignedUniversity: req.user.id }).select('_id');
    const sponsorships = await Sponsorship.find({ $or: [{ project: { $in: projects.map((p) => p._id) } }, { challenge: { $in: challenges.map((c) => c._id) } }] })
      .populate('industry', 'organizationName organizationType expertise name email')
      .populate('project', 'title status')
      .populate('challenge', 'title industryFundingStatus');
    res.json({ success: true, data: sponsorships });
  } catch (error) { next(error); }
};

export const getSponsorships = async (req, res, next) => {
  try {
    const sponsorships = await Sponsorship.find({ industry: req.user.id })
      .populate('project', 'title status university universityDepartment')
      .populate('challenge', 'title category district status priority')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: sponsorships.length, data: sponsorships });
  } catch (error) { next(error); }
};

export const getSponsorship = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Sponsorship not found' });
    const sponsorship = await Sponsorship.findOne({ _id: req.params.id, industry: req.user.id })
      .populate('project', 'title description status university universityDepartment timeline')
      .populate('challenge', 'title category district status priority');
    if (!sponsorship) return res.status(404).json({ success: false, message: 'Sponsorship not found' });
    res.json({ success: true, data: sponsorship });
  } catch (error) { next(error); }
};

export const updateSponsorship = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(404).json({ success: false, message: 'Sponsorship not found' });
    const sponsorship = await Sponsorship.findOne({ _id: req.params.id, industry: req.user.id });
    if (!sponsorship) return res.status(404).json({ success: false, message: 'Sponsorship not found' });
    const nextStatus = req.body.status;
    if (nextStatus && !(sponsorship.status === 'pending' && nextStatus === 'rejected')) {
      return res.status(400).json({ success: false, message: 'Invalid sponsorship status transition' });
    }
    if (nextStatus) sponsorship.status = nextStatus;
    if (typeof req.body.expertise === 'string') sponsorship.expertise = req.body.expertise;
    if (typeof req.body.notes === 'string') sponsorship.notes = req.body.notes;
    await sponsorship.save();
    res.json({ success: true, data: sponsorship });
  } catch (error) { next(error); }
};
