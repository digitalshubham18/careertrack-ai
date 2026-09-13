const JobApplication = require('../models/JobApplication');
const Resume = require('../models/Resume');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateApplicationDocument, TYPE_PROMPTS } = require('../services/applicationAssistant.service');

const generateDocument = asyncHandler(async (req, res) => {
  const { type } = req.body;
  if (!TYPE_PROMPTS[type]) throw ApiError.badRequest(`Unknown document type "${type}"`);

  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) throw ApiError.notFound('Application not found');

  const resume = application.resumeUsed
    ? await Resume.findById(application.resumeUsed)
    : await Resume.findOne({ user: req.user._id, isPrimary: true });

  const content = await generateApplicationDocument(type, { user: req.user, resume, application });

  application.generatedDocuments.push({ type, content });
  await application.save();

  sendSuccess(res, 201, 'Document generated', {
    content,
    document: application.generatedDocuments[application.generatedDocuments.length - 1],
  });
});

const listDocuments = asyncHandler(async (req, res) => {
  const application = await JobApplication.findOne({ _id: req.params.id, user: req.user._id }).select('generatedDocuments');
  if (!application) throw ApiError.notFound('Application not found');
  sendSuccess(res, 200, 'Documents fetched', { documents: application.generatedDocuments });
});

module.exports = { generateDocument, listDocuments };
