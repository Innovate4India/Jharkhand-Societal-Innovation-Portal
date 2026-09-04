import User from '../models/User.js';

// @desc    Get registered university users
// @route   GET /api/users/universities
// @access  Private - Government only
export const getUniversities = async (req, res, next) => {
  try {
    const universities = await User.find({ role: 'university' })
      .select('_id name email institution universityDepartment accountType')
      .sort({ institution: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: universities
    });
  } catch (error) {
    next(error);
  }
};
