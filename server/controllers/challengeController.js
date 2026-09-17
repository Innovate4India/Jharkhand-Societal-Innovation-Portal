import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isAllowedChallengeType, challengeUploadDirectory } from '../middleware/challengeUpload.js';

function toCitizenStatus(status) {
  const normalized = String(status || '').trim().toLowerCase();
  if (['completed', 'resolved'].includes(normalized)) return 'COMPLETE';
  if (['submitted', 'under_review', 'approved', 'assigned', 'accepted', 'funding_approved', 'cancelled', 'in_progress', 'project_proposed', 'prototype', 'testing', 'deployed', 'rejected', 'pending', 'funded', 'proposal_pending', 'proposal_accepted', 'proposal_rejected', 'not_eligible', 'funded_pending_university_acceptance', 'not_required'].includes(normalized)) {
    return 'PENDING';
  }
  return 'PENDING';
}

function serializeCitizenChallenge(challenge) {
  if (!challenge) return null;
  return {
    _id: challenge._id,
    title: challenge.title,
    status: toCitizenStatus(challenge.status)
  };
}

function governmentDistrict(user) {
  return String(user?.governmentDistrict || user?.district || '').trim();
}

function isGovernmentChallengeAccessAllowed(user, challenge) {
  return user?.role === 'government' && governmentDistrict(user) && challenge?.district === governmentDistrict(user);
}

async function verifyChallengeAndReward(challengeId, government) {
  const session = await mongoose.startSession();
  try {
    let verifiedChallenge;
    try {
      await session.withTransaction(async () => {
        const challenge = await Challenge.findOne({
          _id: challengeId,
          status: 'under_review',
          district: governmentDistrict(government),
          rewardProcessed: false
        }).session(session);
        if (!challenge) {
          const error = new Error('Challenge is no longer awaiting verification');
          error.statusCode = 409;
          throw error;
        }
        const citizen = await User.findOne({ _id: challenge.submittedBy, role: 'citizen' }).session(session);
        if (!citizen) {
          const error = new Error('Only Citizen challenges can receive Impact Tokens');
          error.statusCode = 400;
          throw error;
        }
        challenge.status = 'approved';
        challenge.rewardProcessed = true;
        await challenge.save({ session });
        await User.updateOne(
          { _id: citizen._id, role: 'citizen' },
          { $inc: { impactTokens: 1, lifetimeImpactTokens: 1, totalVerifiedProblems: 1 } },
          { session }
        );
        verifiedChallenge = challenge;
      });
      return verifiedChallenge;
    } catch (error) {
      if (error.statusCode || !/transaction|replica set|mongos/i.test(error.message || '')) throw error;
    }

    const challenge = await Challenge.findOneAndUpdate(
      { _id: challengeId, status: 'under_review', district: governmentDistrict(government), rewardProcessed: false },
      { $set: { status: 'approved', rewardProcessed: true } },
      { new: true }
    );
    if (!challenge) {
      const existing = await Challenge.findById(challengeId).select('status');
      if (existing?.status === 'approved') return existing;
      const error = new Error('Challenge is no longer awaiting verification');
      error.statusCode = 409;
      throw error;
    }
    const citizen = await User.findOneAndUpdate(
      { _id: challenge.submittedBy, role: 'citizen' },
      { $inc: { impactTokens: 1, lifetimeImpactTokens: 1, totalVerifiedProblems: 1 } },
      { new: true }
    );
    if (!citizen) {
      await Challenge.updateOne({ _id: challenge._id, status: 'approved', rewardProcessed: true }, { $set: { status: 'under_review', rewardProcessed: false } });
      const error = new Error('Only Citizen challenges can receive Impact Tokens');
      error.statusCode = 400;
      throw error;
    }
    return challenge;
  } finally {
    await session.endSession();
  }
}

async function removeUploadedFiles(files = []) {
  await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => undefined)));
}

function hasValidSignature(file) {
  const bytes = file.buffer;
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (extension === '.png') return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (extension === '.pdf') return bytes.subarray(0, 5).toString() === '%PDF-';
  if (extension === '.mp4') return bytes.subarray(4, 8).toString() === 'ftyp';
  return false;
}

// @desc    Create a new challenge
// @route   POST /api/challenges
// @access  Private - Citizen only
export const createChallenge = async (req, res, next) => {
  const files = req.files || [];
  try {
    const {
      title,
      description,
      category,
      district,
      villageOrCity,
      priority,
      urgency,
      urgencySource,
      urgencyReason,
      affected,
      expectedImpact,
      location,
      media,
      citizenContactNumber
    } = req.body;

    // Validation
    if (!title || !description || !category || !district) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, district'
      });
    }

    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Priority must be one of: ${validPriorities.join(', ')}`
      });
    }
    const validUrgencies = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const normalizedUrgency = urgency === undefined ? 'MEDIUM' : String(urgency).trim().toUpperCase();
    if (!validUrgencies.includes(normalizedUrgency)) {
      return res.status(400).json({
        success: false,
        message: `Urgency must be one of: ${validUrgencies.join(', ')}`
      });
    }
    const validUrgencySources = ['ai_detected', 'manually_adjusted', 'fallback'];
    const normalizedUrgencySource = urgencySource === undefined ? 'fallback' : String(urgencySource).trim();
    if (!validUrgencySources.includes(normalizedUrgencySource)) {
      return res.status(400).json({
        success: false,
        message: `Urgency source must be one of: ${validUrgencySources.join(', ')}`
      });
    }
    if (citizenContactNumber !== undefined && !/^[6-9]\d{9}$/.test(String(citizenContactNumber))) {
      return res.status(400).json({
        success: false,
        message: 'Contact number must be a valid 10-digit Indian mobile number'
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

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one photo, video, or document as supporting evidence.'
      });
    }

    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        await removeUploadedFiles(files);
        return res.status(400).json({
          success: false,
          message: 'Location must contain valid coordinates'
        });
      }
    }

    // Create challenge object
    const challengeObj = {
      title,
      description,
      category,
      district,
      villageOrCity,
      ...(priority ? { priority } : {}),
      urgency: normalizedUrgency,
      urgencySource: normalizedUrgencySource,
      urgencyReason: typeof urgencyReason === 'string' ? urgencyReason.trim().slice(0, 500) : '',
      affected: typeof affected === 'string' ? affected.trim().slice(0, 2000) : '',
      expectedImpact: typeof expectedImpact === 'string' ? expectedImpact.trim().slice(0, 2000) : '',
      status: 'under_review',
      submittedBy: userId,
      ...(citizenContactNumber ? { citizenContactNumber: String(citizenContactNumber) } : {}),
      media: media || { images: [], videos: [], documents: [] }
    };

    const attachmentFiles = [];
    for (const file of files) {
      const extension = path.extname(file.originalname).toLowerCase();
      const fileBytes = await fs.readFile(file.path);
      if (!isAllowedChallengeType(extension, file.mimetype) || !hasValidSignature({ ...file, buffer: fileBytes })) {
        await removeUploadedFiles(files);
        return res.status(400).json({ success: false, message: `Unsupported or invalid file: ${file.originalname}` });
      }
      attachmentFiles.push({
        originalName: path.basename(file.originalname).replace(/[^\w.\- ()]/g, '_').slice(0, 180),
        storedName: path.basename(file.filename),
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: userId,
        uploadedAt: new Date()
      });
    }
    challengeObj.attachments = attachmentFiles;

    // Add location if provided
    if (
      parsedLocation
      && Number.isFinite(Number(parsedLocation.latitude))
      && Number.isFinite(Number(parsedLocation.longitude))
    ) {
      challengeObj.location = {
        latitude: Number(parsedLocation.latitude),
        longitude: Number(parsedLocation.longitude)
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
    await removeUploadedFiles(files);
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

export const downloadChallengeAttachment = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role district governmentDistrict');
    const challenge = await Challenge.findById(req.params.id).select('+attachments.storedName');
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (user?.role === 'government' && !isGovernmentChallengeAccessAllowed(user, challenge)) {
      return res.status(403).json({ success: false, message: 'You do not have access to challenges outside your district' });
    }

    const canAccess = req.user.role === 'government'
      || (req.user.role === 'citizen' && challenge.submittedBy.toString() === req.user.id)
      || (req.user.role === 'university' && challenge.assignedUniversity?.toString() === req.user.id);
    if (!canAccess) return res.status(403).json({ success: false, message: 'You do not have access to this attachment' });

    const attachment = challenge.attachments.id(req.params.attachmentId);
    if (!attachment) return res.status(404).json({ success: false, message: 'Attachment not found' });
    const storedPath = path.resolve(challengeUploadDirectory, attachment.storedName);
    if (!storedPath.startsWith(`${challengeUploadDirectory}${path.sep}`)) {
      return res.status(400).json({ success: false, message: 'Invalid attachment path' });
    }
    res.download(storedPath, attachment.originalName, { headers: { 'Content-Type': attachment.mimeType } }, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(404).json({ success: false, message: 'Attachment not found' });
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

    if (
      !['assigned', 'funding_approved'].includes(challenge.status)
      || !['pending', 'awaiting_acceptance'].includes(challenge.assignmentStatus)
      || challenge.acceptedByUniversity
    ) {
      return res.status(400).json({
        success: false,
        message: 'This challenge cannot be accepted in its current status'
      });
    }

    challenge.assignmentStatus = 'accepted';
    challenge.acceptedByUniversity = req.user.id;
    challenge.acceptedAt = new Date();
    challenge.status = 'accepted';
    if (!challenge.industryFundingStatus || ['pending', 'eligible', 'not_eligible', 'proposal_pending'].includes(challenge.industryFundingStatus)) {
      challenge.industryFundingStatus = 'proposal_pending';
    }
    // Recover legacy records that were funded before acceptance: funding must
    // be explicitly approved again after this acceptance.
    challenge.fundingStatus = 'pending';
    challenge.fundingAmount = 0;
    challenge.fundingApprovedBy = null;
    challenge.fundingApprovedAt = null;
    await challenge.save();
    await challenge.populate([
      { path: 'submittedBy', select: 'name email role district villageOrCity' },
      { path: 'assignedUniversity', select: 'name email institution universityDepartment' },
      { path: 'acceptedByUniversity', select: 'name email institution universityDepartment' }
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
    if (req.user.role === 'industry') {
      return res.status(403).json({ success: false, message: 'Use Industry opportunities for eligible projects' });
    }
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
    } else if (req.user.role === 'government') {
      const user = await User.findById(req.user.id).select('role district governmentDistrict');
      const district = governmentDistrict(user);
      if (!district) return res.status(403).json({ success: false, message: 'Government account requires district assignment' });
      filter.district = district;
    }

    // Get challenges sorted by newest first
    const challengeQuery = Challenge.find(filter);
    if (req.user.role === 'government') {
      challengeQuery.select('+citizenContactNumber');
    }
    challengeQuery
      .populate({
        path: 'submittedBy',
        select: 'name email role district villageOrCity'
      })
      .populate({
        path: 'assignedUniversity',
        select: 'name email institution institution universityDepartment'
      })
      .populate({
        path: 'acceptedByUniversity',
        select: 'name email institution universityDepartment'
      });
    if (req.user.role === 'government') {
      challengeQuery.populate({
        path: 'industryFundedBy',
        select: 'name email organizationName organizationType'
      });
    }
    const challenges = await challengeQuery.sort({ createdAt: -1 });
    const serializedChallenges = req.user.role === 'citizen'
      ? challenges.map(serializeCitizenChallenge)
      : challenges;

    res.status(200).json({
      success: true,
      count: serializedChallenges.length,
      data: serializedChallenges
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
    if (req.user.role === 'industry') {
      return res.status(403).json({ success: false, message: 'Use Industry project opportunities for eligible details' });
    }
    const { id } = req.params;

    const challengeQuery = Challenge.findById(id);
    if (req.user.role === 'government') {
      challengeQuery.select('+citizenContactNumber');
    }
    challengeQuery
      .populate({
        path: 'submittedBy',
        select: 'name email role district villageOrCity'
      })
      .populate({
        path: 'assignedUniversity',
        select: 'name email institution universityDepartment'
      })
      .populate({
        path: 'acceptedByUniversity',
        select: 'name email institution universityDepartment'
      });
    if (req.user.role === 'government') {
      challengeQuery.populate({
        path: 'industryFundedBy',
        select: 'name email organizationName organizationType'
      });
    }
    const challenge = await challengeQuery;

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
    if (req.user.role === 'government') {
      const user = await User.findById(req.user.id).select('role district governmentDistrict');
      if (!isGovernmentChallengeAccessAllowed(user, challenge)) {
        return res.status(403).json({ success: false, message: 'You do not have access to challenges outside your district' });
      }
    }

    res.status(200).json({
      success: true,
      data: req.user.role === 'citizen' ? serializeCitizenChallenge(challenge) : challenge
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

    const validStatuses = ['submitted', 'under_review', 'approved', 'assigned', 'accepted', 'funding_approved', 'cancelled', 'in_progress', 'resolved', 'rejected'];
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

    const existingChallenge = await Challenge.findById(id).select('status district assignedUniversity assignmentStatus acceptedByUniversity');
    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    if (!isGovernmentChallengeAccessAllowed(user, existingChallenge)) {
      return res.status(403).json({ success: false, message: 'You cannot manage challenges outside your district' });
    }
    const allowedTransitions = {
      submitted: ['under_review'],
      under_review: ['approved', 'rejected'],
      approved: ['approved'],
      assigned: ['assigned'],
      accepted: ['accepted', 'funding_approved'],
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

    if (status === 'funding_approved' && (
      !existingChallenge.assignedUniversity ||
      existingChallenge.assignmentStatus !== 'accepted' ||
      !existingChallenge.acceptedByUniversity
    )) {
      return res.status(400).json({
        success: false,
        message: 'University acceptance is required before funding approval'
      });
    }

    if (status === 'approved' && existingChallenge.status === 'under_review') {
      const verifiedChallenge = await verifyChallengeAndReward(id, user);
      await verifiedChallenge.populate([
        { path: 'submittedBy', select: 'name email role district villageOrCity' },
        { path: 'assignedUniversity', select: 'name email institution universityDepartment' }
      ]);
      return res.status(200).json({
        success: true,
        message: 'Challenge verified and one Impact Token awarded',
        data: verifiedChallenge
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

    const existingChallenge = await Challenge.findById(id).select('status district');
    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    if (!isGovernmentChallengeAccessAllowed(user, existingChallenge)) {
      return res.status(403).json({ success: false, message: 'You cannot manage challenges outside your district' });
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

    const existingChallenge = await Challenge.findById(id).select('status district');
    if (!existingChallenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }
    if (!isGovernmentChallengeAccessAllowed(user, existingChallenge)) {
      return res.status(403).json({ success: false, message: 'You cannot manage challenges outside your district' });
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
      {
        assignedUniversity,
        status: 'assigned',
        assignmentStatus: 'pending',
        acceptedByUniversity: null,
        acceptedAt: null,
        fundingAmount: 0,
        fundingStatus: 'pending',
        fundingApprovedBy: null,
        fundingApprovedAt: null,
        cancelledBy: null,
        cancelledAt: null,
        cancellationReason: null
      },
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

// @desc    Cancel an assigned challenge before funding approval
// @route   PATCH /api/challenges/:id/cancel
// @access  Private - Government only
export const cancelChallenge = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'government') {
      return res.status(403).json({ success: false, message: 'Only government users can cancel challenges' });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (!isGovernmentChallengeAccessAllowed(user, challenge)) {
      return res.status(403).json({ success: false, message: 'You cannot manage challenges outside your district' });
    }
    if (!challenge.assignedUniversity || !['pending', 'awaiting_acceptance', 'accepted'].includes(challenge.assignmentStatus)) {
      return res.status(400).json({ success: false, message: 'Only assigned challenges can be cancelled' });
    }
    if (challenge.fundingStatus === 'approved' || challenge.status === 'funding_approved') {
      return res.status(400).json({ success: false, message: 'Funding-approved challenges cannot be cancelled' });
    }

    challenge.status = 'cancelled';
    challenge.cancelledBy = user._id;
    challenge.cancelledAt = new Date();
    challenge.cancellationReason = typeof req.body?.cancellationReason === 'string'
      ? req.body.cancellationReason.trim() || null
      : null;
    await challenge.save();
    await challenge.populate([
      { path: 'assignedUniversity', select: 'name email institution universityDepartment' },
      { path: 'cancelledBy', select: 'name email role' }
    ]);
    return res.status(200).json({ success: true, message: 'Challenge cancelled successfully', data: challenge });
  } catch (error) {
    if (error.kind === 'ObjectId') return res.status(404).json({ success: false, message: 'Challenge not found' });
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

    if (isGovernment && !isGovernmentChallengeAccessAllowed(user, challenge)) {
      return res.status(403).json({ success: false, message: 'You cannot manage challenges outside your district' });
    }

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
