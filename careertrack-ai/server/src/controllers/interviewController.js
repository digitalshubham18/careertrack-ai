const Interview = require('../models/Interview');
const JobApplication = require('../models/JobApplication');
const Resume = require('../models/Resume');
const JobListing = require('../models/JobListing');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const interviewService = require('../services/interview.service');
const { logActivity } = require('../services/activity.service');

const generateQuestions = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw ApiError.notFound('Application not found');

  let resumeSkills = [];
  if (application.resumeUsed) {
    const resume = await Resume.findById(application.resumeUsed);
    resumeSkills = resume?.skills || [];
  }

  // If this application originated from a discovered JobListing, use its
  // structured category + required skills so questions are grounded in the
  // job's actual field (e.g. AI/ML, DevOps, Data Science) instead of
  // defaulting to generic web-dev topics.
  let category;
  let requiredSkills = [];
  if (application.sourceListing) {
    const listing = await JobListing.findById(application.sourceListing);
    if (listing) {
      category = listing.category;
      requiredSkills = listing.requiredSkills || [];
    }
  }

  const questions = await interviewService.generateInterviewQuestions({
    jobTitle: application.jobTitle,
    companyName: application.companyName,
    jobDescription: application.jobDescription,
    resumeSkills,
    requiredSkills,
    category,
  });

  let interview = await Interview.findOne({ jobApplication: application._id });
  if (interview) {
    interview.questions = questions.map((q) => ({ ...q, userAnswer: '' }));
    interview.status = 'generated';
    interview.averageScore = null;
  } else {
    interview = new Interview({
      user: req.user._id,
      jobApplication: application._id,
      questions,
    });
  }
  await interview.save();

  await logActivity({
    userId: req.user._id,
    jobApplicationId: application._id,
    type: 'interview_scheduled',
    description: 'Interview preparation questions generated',
  });

  sendSuccess(res, 201, 'Interview questions generated', { interview });
});

const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ jobApplication: req.params.id, user: req.user._id });
  if (!interview) throw ApiError.notFound('No interview prep found for this application yet');
  sendSuccess(res, 200, 'Interview fetched', { interview });
});

const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, answer } = req.body;
  const interview = await Interview.findOne({ jobApplication: req.params.id, user: req.user._id });
  if (!interview) throw ApiError.notFound('Interview prep not found');

  const question = interview.questions.id(questionId);
  if (!question) throw ApiError.notFound('Question not found');

  question.userAnswer = answer;
  question.answeredAt = new Date();

  const evaluation = await interviewService.evaluateAnswer({
    question: question.question,
    answer,
  });
  question.evaluation = evaluation;

  interview.status = 'in_progress';
  const answeredQuestions = interview.questions.filter((q) => q.evaluation?.score != null);
  if (answeredQuestions.length === interview.questions.length) {
    interview.status = 'completed';
  }
  interview.averageScore =
    answeredQuestions.reduce((sum, q) => sum + q.evaluation.score, 0) / answeredQuestions.length;

  await interview.save();

  sendSuccess(res, 200, 'Answer evaluated (practice feedback - not an actual hiring decision)', {
    interview,
  });
});

module.exports = { generateQuestions, getInterview, submitAnswer };
