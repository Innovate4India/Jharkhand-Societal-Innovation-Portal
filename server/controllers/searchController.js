import mongoose from 'mongoose';
import Challenge from '../models/Challenge.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

const limit = 20;

function result(type, item, href, description = '') {
  return {
    type,
    id: item._id.toString(),
    title: item.title || item.name || item.solutionTitle || item.email,
    description: String(description || item.description || '').slice(0, 180),
    status: item.status || item.solutionStatus || '',
    href,
  };
}

export async function searchPortal(req, res) {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) return res.json({ success: true, data: [] });
  const expression = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const actor = await User.findById(req.user.id).select('role district governmentDistrict institution universityDepartment accountType universityRole');
  if (!actor) return res.status(401).json({ success: false, message: 'User not found' });

  let challengeFilter = {};
  let projectFilter = {};
  if (actor.role === 'citizen') {
    challengeFilter.submittedBy = actor._id;
    projectFilter = {
      $or: [
        { createdBy: actor._id },
        { teamMembers: actor._id },
        { status: { $in: ['deployed', 'completed'] }, solutionStatus: 'submitted' },
      ],
    };
  } else if (actor.role === 'government') {
    challengeFilter.district = actor.governmentDistrict || actor.district;
    const districtChallengeIds = await Challenge.distinct('_id', { district: challengeFilter.district });
    projectFilter = { challenge: { $in: districtChallengeIds }, status: { $in: ['deployed', 'completed'] } };
  } else if (actor.role === 'university') {
    const universityIds = await User.find({ role: 'university', institution: actor.institution }).distinct('_id');
    challengeFilter = { assignedUniversity: { $in: universityIds } };
    projectFilter = { university: { $in: universityIds } };
  } else if (actor.role === 'industry') {
    projectFilter = { industryPartners: actor._id };
    challengeFilter = { status: { $in: ['approved', 'assigned', 'accepted', 'funding_approved', 'in_progress'] } };
  }

  const [challenges, projects] = await Promise.all([
    Challenge.find({
      ...challengeFilter,
      $or: [{ title: expression }, { description: expression }, { status: expression }, { district: expression }],
    }).select('title description status _id').limit(limit).lean(),
    Project.find({
      ...projectFilter,
      $or: [{ title: expression }, { description: expression }, { status: expression }, { solutionTitle: expression }],
    }).select('title description status solutionTitle solutionStatus _id').limit(limit).lean(),
  ]);

  const results = [
    ...challenges.map((item) => result('challenge', item, `/challenges/${item._id}`, item.description)),
    ...projects.map((item) => result('project', item, `/projects/${item._id}`, item.description || item.solutionTitle)),
  ].slice(0, limit);

  if (actor.role === 'university') {
    const people = await User.find({
      role: 'university',
      institution: actor.institution,
      $or: [{ name: expression }, { email: expression }, { universityDepartment: expression }],
    }).select('name email universityDepartment _id').limit(Math.max(0, limit - results.length)).lean();
    results.push(...people.map((item) => result('user', item, '/', item.universityDepartment || item.email)));
  }

  return res.json({ success: true, data: results.slice(0, limit) });
}
