const DsaEntry = require('../models/DsaEntry');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const dsaService = require('../services/dsa.service');

const logEntry = asyncHandler(async (req, res) => {
  const entry = await DsaEntry.create({ ...req.body, user: req.user._id });
  sendSuccess(res, 201, 'Problem logged', { entry });
});

const listEntries = asyncHandler(async (req, res) => {
  const { topic, difficulty, page = 1, limit = 20 } = req.query;
  const query = { user: req.user._id };
  if (topic) query.topic = topic;
  if (difficulty) query.difficulty = difficulty;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [entries, total] = await Promise.all([
    DsaEntry.find(query).sort({ solvedAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    DsaEntry.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Entries fetched', {
    entries,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await DsaEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!entry) throw ApiError.notFound('Entry not found');
  sendSuccess(res, 200, 'Entry deleted');
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dsaService.getSummary(req.user._id, req.user.dsaDailyGoal);
  sendSuccess(res, 200, 'DSA summary fetched', { summary });
});

const updateGoal = asyncHandler(async (req, res) => {
  const { dailyGoal } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { dsaDailyGoal: dailyGoal }, { new: true });
  sendSuccess(res, 200, 'Daily goal updated', { dsaDailyGoal: user.dsaDailyGoal });
});

module.exports = { logEntry, listEntries, deleteEntry, getSummary, updateGoal };
