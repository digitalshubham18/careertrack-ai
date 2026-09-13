const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const Resume = require('../models/Resume');
const ATSAnalysis = require('../models/ATSAnalysis');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const query = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Users fetched', {
    users: users.map((u) => u.toSafeObject()),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.role === 'admin') throw ApiError.forbidden('Cannot disable another admin account');

  user.isActive = !user.isActive;
  await user.save();

  sendSuccess(res, 200, `User account ${user.isActive ? 'enabled' : 'disabled'}`, {
    user: user.toSafeObject(),
  });
});

const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalApplications,
    totalResumeAnalyses,
    avgAtsScoreResult,
    topSkills,
    topRoles,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    JobApplication.countDocuments(),
    ATSAnalysis.countDocuments(),
    ATSAnalysis.aggregate([{ $group: { _id: null, avg: { $avg: '$scores.overall' } } }]),
    Resume.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { skill: '$_id', count: 1, _id: 0 } },
    ]),
    JobApplication.aggregate([
      { $group: { _id: '$jobTitle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { role: '$_id', count: 1, _id: 0 } },
    ]),
  ]);

  sendSuccess(res, 200, 'Platform analytics fetched', {
    totalUsers,
    activeUsers,
    totalApplications,
    totalResumeAnalyses,
    aiRequests: totalResumeAnalyses, // proxy metric: every analysis makes >=1 AI call
    averageAtsScore: Math.round(avgAtsScoreResult[0]?.avg || 0),
    topSkills,
    topRoles,
  });
});

module.exports = { listUsers, toggleUserActive, getPlatformAnalytics };
