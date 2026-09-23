import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Challenge from '../models/Challenge.js';
import Project from '../models/Project.js';

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  const targetEmails = ['government@test.com', 'university@test.com'];
  const targetUsers = await User.find({ email: { $in: targetEmails } })
    .select('-password')
    .sort({ email: 1 })
    .lean();
  const targetUserIds = targetUsers.map((user) => user._id);
  const universityTestUser = targetUsers.find((user) => user.email === 'university@test.com');
  const universityTestUserId = universityTestUser?._id;

  const relatedTestProjects = await Project.find({
    $or: [
      { title: 'Clean Drinking Water Solution' },
      ...(universityTestUserId ? [{ university: universityTestUserId }, { createdBy: universityTestUserId }] : [])
    ]
  })
    .populate('university', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('challenge', 'title submittedBy status')
    .sort({ createdAt: 1 })
    .lean();

  const citizenUsers = await User.find({ role: 'citizen' })
    .select('_id name email role mobile district villageOrCity createdAt')
    .sort({ createdAt: 1 })
    .lean();
  const citizenUserIds = citizenUsers.map((user) => user._id);

  const citizenChallenges = await Challenge.find({ submittedBy: { $in: citizenUserIds } })
    .populate('submittedBy', 'name email role')
    .populate('assignedUniversity', 'name email role')
    .select('title description category district villageOrCity status priority submittedBy assignedUniversity createdAt')
    .sort({ createdAt: 1 })
    .lean();

  const protectedChallenge = await Challenge.find({ title: 'Poor Waste Management in Residential Areas' })
    .populate('submittedBy', 'name email role')
    .populate('assignedUniversity', 'name email role')
    .select('title description category district villageOrCity status priority submittedBy assignedUniversity createdAt')
    .lean();

  const referencesToTargetUsers = await Challenge.find({
    $or: [
      { submittedBy: { $in: targetUserIds } },
      { assignedUniversity: { $in: targetUserIds } }
    ]
  })
    .populate('submittedBy', 'name email role')
    .populate('assignedUniversity', 'name email role')
    .select('title description status priority submittedBy assignedUniversity createdAt')
    .sort({ createdAt: 1 })
    .lean();

  console.log(JSON.stringify({
    'TARGET USERS': targetUsers,
    'RELATED TEST PROJECTS': relatedTestProjects,
    'CITIZEN USERS': citizenUsers,
    'CITIZEN CHALLENGES': citizenChallenges,
    'PROTECTED CHALLENGE': protectedChallenge,
    'REFERENCES TO TARGET USERS': referencesToTargetUsers
  }, null, 2));
} finally {
  await mongoose.disconnect();
}
