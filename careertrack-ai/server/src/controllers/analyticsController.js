const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).setHours(0, 0, 0, 0);
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const [
    total,
    thisWeek,
    thisMonth,
    byStatus,
    byCompany,
    byLocation,
    overTime,
  ] = await Promise.all([
    JobApplication.countDocuments({ user: userId }),
    JobApplication.countDocuments({ user: userId, createdAt: { $gte: new Date(startOfWeek()) } }),
    JobApplication.countDocuments({ user: userId, createdAt: { $gte: startOfMonth() } }),
    JobApplication.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),
    JobApplication.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$companyName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { company: '$_id', count: 1, _id: 0 } },
    ]),
    JobApplication.aggregate([
      { $match: { user: userId, location: { $ne: '' } } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { location: '$_id', count: 1, _id: 0 } },
    ]),
    JobApplication.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]),
  ]);

  const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s.count]));
  const interviews =
    (statusCounts['Interview'] || 0) +
    (statusCounts['Technical Interview'] || 0) +
    (statusCounts['HR Interview'] || 0);
  const offers = statusCounts['Offer'] || 0;
  const rejections = statusCounts['Rejected'] || 0;
  const applied = total - (statusCounts['Saved'] || 0);

  const interviewRate = applied ? Math.round((interviews / applied) * 100) : 0;
  const offerRate = applied ? Math.round((offers / applied) * 100) : 0;
  const responseRate = applied
    ? Math.round(((interviews + offers + rejections) / applied) * 100)
    : 0;

  sendSuccess(res, 200, 'Dashboard analytics fetched', {
    summary: {
      total,
      thisWeek,
      thisMonth,
      interviews,
      offers,
      rejections,
      interviewRate,
      offerRate,
      responseRate,
    },
    charts: {
      byStatus,
      byCompany,
      byLocation,
      overTime,
    },
  });
});

module.exports = { getDashboardAnalytics };
