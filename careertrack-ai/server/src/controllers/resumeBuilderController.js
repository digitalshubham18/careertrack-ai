const Resume = require('../models/Resume');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadResumeBuffer } = require('../config/storage');
const { generateResumePdf } = require('../services/resumePdf.service');
const resumeBuilderService = require('../services/resumeBuilder.service');

const BUILDER_FIELDS = ['summary', 'skills', 'education', 'experience', 'projects', 'certifications', 'achievements'];

const createDraft = asyncHandler(async (req, res) => {
  const existingCount = await Resume.countDocuments({ user: req.user._id });

  const resume = await Resume.create({
    user: req.user._id,
    origin: 'builder',
    filename: `builder-draft-${Date.now()}`,
    originalFilename: 'My Resume (Builder)',
    parseStatus: 'parsed', // user-authored, nothing to parse
    isPrimary: existingCount === 0,
    summary: '',
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
  });

  sendSuccess(res, 201, 'Resume draft created', { resume });
});

const updateDraft = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id, origin: 'builder' });
  if (!resume) throw ApiError.notFound('Resume draft not found');

  for (const field of BUILDER_FIELDS) {
    if (req.body[field] !== undefined) resume[field] = req.body[field];
  }
  await resume.save();

  sendSuccess(res, 200, 'Resume draft saved', { resume });
});

const exportPdf = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id, origin: 'builder' });
  if (!resume) throw ApiError.notFound('Resume draft not found');

  const pdfBuffer = await generateResumePdf({ user: req.user, resume });
  const filename = `${req.user.name.replace(/\s+/g, '_')}_Resume.pdf`;
  const { url, storageKey } = await uploadResumeBuffer(pdfBuffer, filename, req.user._id.toString());

  resume.storageUrl = url;
  resume.storageKey = storageKey;
  resume.mimeType = 'application/pdf';
  resume.sizeBytes = pdfBuffer.length;
  resume.originalFilename = filename;
  await resume.save();

  sendSuccess(res, 200, 'Resume exported to PDF', { resume });
});

const aiGenerateSummary = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id, origin: 'builder' });
  if (!resume) throw ApiError.notFound('Resume draft not found');

  const summary = await resumeBuilderService.generateSummary({
    skills: resume.skills,
    experience: resume.experience,
    targetRole: req.body.targetRole || '',
  });

  sendSuccess(res, 200, 'Summary suggestion generated', { summary });
});

const aiImproveBullet = asyncHandler(async (req, res) => {
  const { text, context } = req.body;
  if (!text) throw ApiError.badRequest('text is required');

  const improved = await resumeBuilderService.improveBullet({ text, context: context || '' });
  sendSuccess(res, 200, 'Bullet suggestion generated', { improved });
});

const aiOptimizeKeywords = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id, origin: 'builder' });
  if (!resume) throw ApiError.notFound('Resume draft not found');
  const { jobDescription } = req.body;
  if (!jobDescription) throw ApiError.badRequest('jobDescription is required');

  const resumeText = [
    resume.summary,
    resume.skills.join(', '),
    ...resume.experience.map((e) => `${e.title} ${e.company} ${e.description}`),
  ].join('\n');

  const suggestions = await resumeBuilderService.optimizeKeywords({ resumeText, jobDescription });
  sendSuccess(res, 200, 'Keyword suggestions generated', { suggestions });
});

module.exports = { createDraft, updateDraft, exportPdf, aiGenerateSummary, aiImproveBullet, aiOptimizeKeywords };
