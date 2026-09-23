import ClubActivity from '../models/ClubActivity.js';
import User from '../models/User.js';
import { UNIVERSITY_CLUBS } from '../constants/universityClubs.js';

async function getClubUser(req) {
  return User.findById(req.user.id).select('role institution primaryClub clubRole clubCoordinatorClub name email universityDepartment accountType');
}

function validClub(club) {
  return UNIVERSITY_CLUBS.includes(club);
}

function canAccessClub(user, club) {
  return user?.role === 'university'
    && (user.primaryClub === club || (user.clubRole === 'coordinator' && user.clubCoordinatorClub === club));
}

export const getClubMembers = async (req, res, next) => {
  try {
    const user = await getClubUser(req);
    const club = req.params.club;
    if (!canAccessClub(user, club)) return res.status(403).json({ success: false, message: 'You do not belong to this club' });
    if (!validClub(club)) return res.status(404).json({ success: false, message: 'Club not found' });
    const members = await User.find({ role: 'university', institution: user.institution, primaryClub: club })
      .select('_id name email universityDepartment accountType clubRole')
      .sort({ name: 1 }).lean();
    return res.json({ success: true, data: members });
  } catch (error) { next(error); }
};

export const getClubActivities = async (req, res, next) => {
  try {
    const user = await getClubUser(req);
    const club = req.params.club;
    if (!canAccessClub(user, club)) return res.status(403).json({ success: false, message: 'You do not belong to this club' });
    if (!validClub(club)) return res.status(404).json({ success: false, message: 'Club not found' });
    const universityUser = await User.findById(req.user.id).select('institution');
    const scoped = await ClubActivity.find({ club, university: { $in: await User.find({ role: 'university', institution: universityUser.institution }).distinct('_id') } })
      .populate('createdBy', 'name email').populate('participants', 'name email universityDepartment accountType').sort({ date: 1 });
    return res.json({ success: true, data: scoped });
  } catch (error) { next(error); }
};

export const createClubActivity = async (req, res, next) => {
  try {
    const user = await getClubUser(req);
    const club = req.params.club;
    const { title, description, date } = req.body;
    if (!user || user.role !== 'university' || user.clubRole !== 'coordinator' || user.clubCoordinatorClub !== club) return res.status(403).json({ success: false, message: 'Only the authorized coordinator of this club can create activities' });
    if (!validClub(club) || !title || !description || !date) return res.status(400).json({ success: false, message: 'Title, description, date, and a valid club are required' });
    const activity = await ClubActivity.create({ title, description, club, university: user._id, date: new Date(date), createdBy: user._id });
    return res.status(201).json({ success: true, data: await activity.populate('createdBy', 'name email') });
  } catch (error) { next(error); }
};

export const updateClubActivity = async (req, res, next) => {
  try {
    const user = await getClubUser(req);
    const activity = await ClubActivity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    const coordinatorUniversity = await User.findOne({ _id: activity.university }).select('institution');
    if (!user || !coordinatorUniversity || user.clubRole !== 'coordinator' || user.clubCoordinatorClub !== activity.club || user.institution !== coordinatorUniversity.institution) return res.status(403).json({ success: false, message: 'You cannot manage this activity' });
    const { title, description, date, status } = req.body;
    if (status && !['upcoming', 'completed'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid activity status' });
    Object.assign(activity, { ...(title ? { title } : {}), ...(description ? { description } : {}), ...(date ? { date: new Date(date) } : {}), ...(status ? { status } : {}) });
    await activity.save();
    return res.json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const registerForClubActivity = async (req, res, next) => {
  try {
    const user = await getClubUser(req);
    const activity = await ClubActivity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    const universityUsers = await User.find({ role: 'university', institution: user?.institution }).distinct('_id');
    if (!user || user.role !== 'university' || user.primaryClub !== activity.club || !universityUsers.some((id) => id.toString() === activity.university.toString())) return res.status(403).json({ success: false, message: 'Only members of this University club can participate' });
    if (activity.participants.some((id) => id.toString() === user._id.toString())) return res.status(409).json({ success: false, message: 'You are already registered for this activity' });
    activity.participants.addToSet(user._id);
    await activity.save();
    return res.json({ success: true, data: activity });
  } catch (error) { next(error); }
};
