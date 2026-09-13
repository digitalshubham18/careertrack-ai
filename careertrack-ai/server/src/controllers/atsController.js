const Resume = require('../models/Resume');
const JobApplication = require('../models/JobApplication');
const ATSAnalysis = require('../models/ATSAnalysis');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const atsService = require('../services/ats.service');
const { logActivity } = require('../services/activity.service');
const { createNotification } = require('../services/notification.service');

const analyzeResume = asyncHandler(async (req, res) => {
  const { resumeId, jobDescription, jobApplicationId } = req.body;

  const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');
  if (resume.parseStatus !== 'parsed') {
    throw ApiError.badRequest('This resume is still being processed. Please try again shortly.');
  }

  let application = null;
  if (jobApplicationId) {
    application = await JobApplication.findOne({ _id: jobApplicationId, user: req.user._id });
    if (!application) throw ApiError.notFound('Job application not found');
  }

  const result = await atsService.analyzeResumeAgainstJob({ resume, jobDescription });

  const analysis = await ATSAnalysis.create({
    user: req.user._id,
    resume: resume._id,
    jobApplication: application?._id || null,
    jobDescriptionSnapshot: jobDescription,
    scores: result.scores,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    matchedKeywords: result.matchedKeywords,
    missingKeywords: result.missingKeywords,
    jobRequirements: result.jobRequirements,
    recommendations: result.recommendations,
    aiSummary: result.aiSummary,
  });

  if (application) {
    application.atsScore = result.scores.overall;
    application.latestAtsAnalysis = analysis._id;
    application.jobDescription = application.jobDescription || jobDescription;
    await application.save();

    await logActivity({
      userId: req.user._id,
      jobApplicationId: application._id,
      type: 'resume_analyzed',
      description: `Resume analyzed - ATS score ${result.scores.overall}/100`,
    });

    await createNotification(req.io, {
      userId: req.user._id,
      type: 'resume_analysis_complete',
      title: 'Resume analysis complete',
      message: `Your ATS score for ${application.jobTitle} at ${application.companyName} is ${result.scores.overall}/100`,
      relatedApplication: application._id,
    });
  }

  sendSuccess(res, 201, 'Resume analyzed successfully', { analysis });
});

const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await ATSAnalysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!analysis) throw ApiError.notFound('Analysis not found');
  sendSuccess(res, 200, 'Analysis fetched', { analysis });
});

const listAnalysesForResume = asyncHandler(async (req, res) => {
  const analyses = await ATSAnalysis.find({ user: req.user._id, resume: req.params.resumeId }).sort({
    createdAt: -1,
  });
  sendSuccess(res, 200, 'Analyses fetched', { analyses });
});

module.exports = { analyzeResume, getAnalysis, listAnalysesForResume };
