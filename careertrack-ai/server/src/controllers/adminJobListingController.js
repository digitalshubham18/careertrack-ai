const crypto = require('crypto');
const JobListing = require('../models/JobListing');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeTitle, normalizeCompany } = require('../services/jobs/jobDeduplication.service');
const { categorizeJob } = require('../services/jobs/jobCategorization.service');

const createJob = asyncHandler(async (req, res) => {
  const payload = req.body;

  const job = await JobListing.create({
    ...payload,
    normalizedTitle: normalizeTitle(payload.title),
    normalizedCompany: normalizeCompany(payload.companyName),
    category: payload.category || categorizeJob(payload.title, payload.description),
    source: 'admin',
    sourceJobId: `admin-${crypto.randomUUID()}`,
    sourceName: 'CareerTrack Admin',
    createdBy: req.user._id,
    status: payload.status || 'DRAFT',
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    lastUpdatedAt: new Date(),
    publishedAt: payload.status === 'PUBLISHED' ? new Date() : null,
  });

  sendSuccess(res, 201, 'Job listing created', { job });
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');

  Object.assign(job, req.body);
  if (req.body.title) job.normalizedTitle = normalizeTitle(req.body.title);
  if (req.body.companyName) job.normalizedCompany = normalizeCompany(req.body.companyName);
  job.lastUpdatedAt = new Date();
  await job.save();

  sendSuccess(res, 200, 'Job listing updated', { job });
});

const publishJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');

  job.status = 'PUBLISHED';
  job.publishedAt = job.publishedAt || new Date();
  await job.save();

  // Every user can now see this job (single shared document - see model comments).
  sendSuccess(res, 200, 'Job published — visible to all users', { job });
});

const closeJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');

  job.status = 'CLOSED';
  await job.save();

  sendSuccess(res, 200, 'Job closed', { job });
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findByIdAndDelete(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');
  sendSuccess(res, 200, 'Job listing deleted');
});

const listAllJobs = asyncHandler(async (req, res) => {
  const { status, source, category, company, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (source) query.source = source;
  if (category) query.category = category;
  if (company) query.companyName = { $regex: company, $options: 'i' };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [jobs, total] = await Promise.all([
    JobListing.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    JobListing.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Jobs fetched', {
    jobs,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getJobAnalytics = asyncHandler(async (req, res) => {
  const [totalJobs, activeJobs, closedJobs, importedJobs, adminJobs, byCategory] = await Promise.all([
    JobListing.countDocuments(),
    JobListing.countDocuments({ status: 'PUBLISHED' }),
    JobListing.countDocuments({ status: { $in: ['CLOSED', 'EXPIRED'] } }),
    JobListing.countDocuments({ source: { $ne: 'admin' } }),
    JobListing.countDocuments({ source: 'admin' }),
    JobListing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]),
  ]);

  sendSuccess(res, 200, 'Job analytics fetched', {
    totalJobs, activeJobs, closedJobs, importedJobs, adminJobs, byCategory,
  });
});

module.exports = { createJob, updateJob, publishJob, closeJob, deleteJob, listAllJobs, getJobAnalytics };
