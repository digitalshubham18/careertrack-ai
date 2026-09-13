const JobApplication = require('../models/JobApplication');
const Activity = require('../models/Activity');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activity.service');
const { createNotification } = require('../services/notification.service');

const createApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.create({ ...req.body, user: req.user._id });

  await logActivity({
    userId: req.user._id,
    jobApplicationId: application._id,
    type: 'application_created',
    description: `Application created for ${application.jobTitle} at ${application.companyName}`,
  });

  sendSuccess(res, 201, 'Application created successfully', { application });
});

const listApplications = asyncHandler(async (req, res) => {
  const {
    search, status, location, priority, sort = 'newest',
    page = 1, limit = 20,
  } = req.query;

  const query = { user: req.user._id };

  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { jobTitle: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.status = status;
  if (location) query.location = { $regex: location, $options: 'i' };
  if (priority) query.priority = priority;

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    highestSalary: { salaryRange: -1 },
    highestAts: { atsScore: -1 },
    priority: { priority: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [applications, total] = await Promise.all([
    JobApplication.find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('resumeUsed', 'originalFilename'),
    JobApplication.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Applications fetched', {
    applications,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id })
    .populate('resumeUsed', 'originalFilename')
    .populate('latestAtsAnalysis');
  if (!application) throw ApiError.notFound('Application not found');

  const activity = await Activity.find({ jobApplication: application._id }).sort({ createdAt: 1 });

  sendSuccess(res, 200, 'Application fetched', { application, activity });
});

const updateApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw ApiError.notFound('Application not found');

  Object.assign(application, req.body);
  await application.save();

  await logActivity({
    userId: req.user._id,
    jobApplicationId: application._id,
    type: 'application_updated',
    description: 'Application details updated',
  });

  sendSuccess(res, 200, 'Application updated successfully', { application });
});

const updateStatus = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw ApiError.notFound('Application not found');

  const previousStatus = application.status;
  application.status = req.body.status;
  await application.save();

  await logActivity({
    userId: req.user._id,
    jobApplicationId: application._id,
    type: 'status_changed',
    description: `Status changed from ${previousStatus} to ${application.status}`,
    metadata: { previousStatus, newStatus: application.status },
  });

  await createNotification(req.io, {
    userId: req.user._id,
    type: 'status_update',
    title: 'Application status updated',
    message: `${application.jobTitle} at ${application.companyName} is now "${application.status}"`,
    relatedApplication: application._id,
  });

  sendSuccess(res, 200, 'Status updated successfully', { application });
});

const deleteApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!application) throw ApiError.notFound('Application not found');
  await Activity.deleteMany({ jobApplication: application._id });
  sendSuccess(res, 200, 'Application deleted successfully');
});

const addNote = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw ApiError.notFound('Application not found');

  application.notes = req.body.notes;
  await application.save();

  await logActivity({
    userId: req.user._id,
    jobApplicationId: application._id,
    type: 'note_added',
    description: 'Note updated',
  });

  sendSuccess(res, 200, 'Note saved', { application });
});

module.exports = {
  createApplication,
  listApplications,
  getApplication,
  updateApplication,
  updateStatus,
  deleteApplication,
  addNote,
};
