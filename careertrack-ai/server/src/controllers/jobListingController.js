const JobListing = require('../models/JobListing');
const SavedJob = require('../models/SavedJob');
const JobView = require('../models/JobView');
const JobMatch = require('../models/JobMatch');
const JobApplication = require('../models/JobApplication');
const Resume = require('../models/Resume');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getOrComputeMatch } = require('../services/jobs/jobMatching.service');
const { logActivity } = require('../services/activity.service');

const SDE_ROLE_PATTERN = /(software (development )?engineer|\bsde\b|\bswe\b|frontend engineer|backend engineer|full[\s-]?stack developer|software engineer|ai\/ml engineer|devops engineer)/i;

const listJobs = asyncHandler(async (req, res) => {
  const {
    search, location, workMode, employmentType, category, company,
    sort = 'newest', page = 1, limit = 20,
  } = req.query;

  const query = { status: 'PUBLISHED' };
  if (search) query.$text = { $search: search };
  if (location) query.location = { $regex: location, $options: 'i' };
  if (workMode) query.workMode = workMode;
  if (employmentType) query.employmentType = employmentType;
  if (category) query.category = category;
  if (company) query.companyName = { $regex: company, $options: 'i' };

  const sortMap = {
    newest: { publishedAt: -1 },
    closingSoon: { deadline: 1 },
    salary: { salary: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [jobs, total] = await Promise.all([
    JobListing.find(query).sort(sortMap[sort] || sortMap.newest).skip((pageNum - 1) * limitNum).limit(limitNum),
    JobListing.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Jobs fetched', {
    jobs,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getNewJobs = asyncHandler(async (req, res) => {
  const jobs = await JobListing.find({ status: 'PUBLISHED' }).sort({ publishedAt: -1 }).limit(30);
  sendSuccess(res, 200, 'New jobs fetched', { jobs });
});

const getClosingSoon = asyncHandler(async (req, res) => {
  const jobs = await JobListing.find({
    status: 'PUBLISHED',
    deadline: { $ne: null, $gte: new Date() },
  }).sort({ deadline: 1 }).limit(30);
  sendSuccess(res, 200, 'Closing-soon jobs fetched', { jobs });
});

const getRemoteJobs = asyncHandler(async (req, res) => {
  const jobs = await JobListing.find({ status: 'PUBLISHED', workMode: 'Remote' })
    .sort({ publishedAt: -1 })
    .limit(30);
  sendSuccess(res, 200, 'Remote jobs fetched', { jobs });
});

const getSdeJobs = asyncHandler(async (req, res) => {
  const jobs = await JobListing.find({ status: 'PUBLISHED', title: SDE_ROLE_PATTERN })
    .sort({ publishedAt: -1 })
    .limit(30);
  sendSuccess(res, 200, 'SDE jobs fetched', { jobs });
});

/**
 * Recommended feed: computes/reuses match scores against the user's primary
 * resume and returns the highest-scoring open jobs. Falls back to newest
 * jobs if the user has no parsed primary resume yet (still useful, not
 * blank), so this is never a dead end.
 */
const getRecommendedJobs = asyncHandler(async (req, res) => {
  if (!req.user.primaryResume) {
    const jobs = await JobListing.find({ status: 'PUBLISHED' }).sort({ publishedAt: -1 }).limit(20);
    return sendSuccess(res, 200, 'Recommended jobs fetched (upload a resume for personalized matching)', { jobs, personalized: false });
  }

  const resume = await Resume.findById(req.user.primaryResume);
  if (!resume || resume.parseStatus !== 'parsed') {
    const jobs = await JobListing.find({ status: 'PUBLISHED' }).sort({ publishedAt: -1 }).limit(20);
    return sendSuccess(res, 200, 'Recommended jobs fetched (resume still processing)', { jobs, personalized: false });
  }

  const candidateJobs = await JobListing.find({ status: 'PUBLISHED' }).sort({ publishedAt: -1 }).limit(100);

  const matches = [];
  for (const job of candidateJobs) {
    // eslint-disable-next-line no-await-in-loop
    const match = await getOrComputeMatch({ userId: req.user._id, resumeId: resume._id, job });
    matches.push({ job, matchScore: match.overallScore });
  }
  matches.sort((a, b) => b.matchScore - a.matchScore);

  const jobs = matches.slice(0, 20).map(({ job, matchScore }) => ({ ...job.toObject(), matchScore }));
  return sendSuccess(res, 200, 'Recommended jobs fetched', { jobs, personalized: true });
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const saved = await SavedJob.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('jobListing');
  const jobs = saved.filter((s) => s.jobListing).map((s) => s.jobListing);
  sendSuccess(res, 200, 'Saved jobs fetched', { jobs });
});

const getAppliedJobs = asyncHandler(async (req, res) => {
  const applications = await JobApplication.find({ user: req.user._id, sourceListing: { $ne: null } })
    .populate('sourceListing')
    .sort({ createdAt: -1 });
  const jobs = applications.filter((a) => a.sourceListing).map((a) => a.sourceListing);
  sendSuccess(res, 200, 'Applied jobs fetched', { jobs });
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');

  // Deduplicated view tracking: one meaningful view per (user, job, day).
  const viewDate = new Date().toISOString().slice(0, 10);
  try {
    const created = await JobView.findOneAndUpdate(
      { user: req.user._id, jobListing: job._id, viewDate },
      { $setOnInsert: { user: req.user._id, jobListing: job._id, viewDate } },
      { upsert: true, new: false }
    );
    if (!created) {
      job.viewCount += 1;
      await job.save();
    }
  } catch {
    // Race on the unique index is harmless - just means the view was already counted today.
  }

  const isSaved = await SavedJob.exists({ user: req.user._id, jobListing: job._id });
  sendSuccess(res, 200, 'Job fetched', { job, isSaved: Boolean(isSaved) });
});

const saveJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');

  const existing = await SavedJob.findOne({ user: req.user._id, jobListing: job._id });
  if (!existing) {
    await SavedJob.create({ user: req.user._id, jobListing: job._id });
    job.saveCount += 1;
    await job.save();
  }

  sendSuccess(res, 200, 'Job saved');
});

const unsaveJob = asyncHandler(async (req, res) => {
  const removed = await SavedJob.findOneAndDelete({ user: req.user._id, jobListing: req.params.id });
  if (removed) {
    await JobListing.findByIdAndUpdate(req.params.id, { $inc: { saveCount: -1 } });
  }
  sendSuccess(res, 200, 'Job unsaved');
});

/**
 * "Applying" to a CareerTrack-discovered listing creates a linked
 * JobApplication (so it shows up in the existing tracker/Kanban) and
 * returns the real application URL so the frontend can send the user to
 * the source - CareerTrack never claims to submit an external application
 * on the user's behalf (spec #54).
 */
const applyToJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');
  if (job.status !== 'PUBLISHED') throw ApiError.badRequest('This job is no longer accepting applications');

  const existingApplication = await JobApplication.findOne({ user: req.user._id, sourceListing: job._id });
  if (existingApplication) {
    return sendSuccess(res, 200, 'You already have this application tracked', {
      application: existingApplication,
      applicationUrl: job.applicationUrl,
    });
  }

  const application = await JobApplication.create({
    user: req.user._id,
    companyName: job.companyName,
    jobTitle: job.title,
    jobUrl: job.applicationUrl,
    location: job.location,
    employmentType: job.employmentType,
    salaryRange: job.salary,
    jobDescription: job.description,
    status: 'Applied',
    sourceListing: job._id,
    resumeUsed: req.user.primaryResume || null,
  });

  await logActivity({
    userId: req.user._id,
    jobApplicationId: application._id,
    type: 'application_created',
    description: `Applied via CareerTrack job discovery: ${job.title} at ${job.companyName}`,
  });

  job.applyCount += 1;
  await job.save();

  sendSuccess(res, 201, 'Application tracked. Complete your application on the company site.', {
    application,
    applicationUrl: job.applicationUrl,
  });
});

const matchJob = asyncHandler(async (req, res) => {
  const job = await JobListing.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job listing not found');

  const resumeId = req.body.resumeId || req.user.primaryResume;
  if (!resumeId) throw ApiError.badRequest('Upload and set a primary resume first, or specify resumeId');

  const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');
  if (resume.parseStatus !== 'parsed') throw ApiError.badRequest('This resume is still being processed');

  const match = await getOrComputeMatch({ userId: req.user._id, resumeId: resume._id, job });
  sendSuccess(res, 200, 'Match computed', { match });
});

module.exports = {
  listJobs, getNewJobs, getClosingSoon, getRemoteJobs, getSdeJobs, getRecommendedJobs,
  getSavedJobs, getAppliedJobs, getJobById, saveJob, unsaveJob, applyToJob, matchJob,
};
