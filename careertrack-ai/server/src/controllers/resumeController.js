const Resume = require('../models/Resume');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadResumeBuffer, deleteResumeFile } = require('../config/storage');
const resumeParser = require('../services/resumeParser.service');
const logger = require('../utils/logger');

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No resume file provided');

  const existingCount = await Resume.countDocuments({ user: req.user._id });
  const { url, storageKey } = await uploadResumeBuffer(
    req.file.buffer,
    req.file.originalname,
    req.user._id.toString()
  );

  const resume = await Resume.create({
    user: req.user._id,
    filename: storageKey,
    originalFilename: req.file.originalname,
    storageUrl: url,
    storageKey,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    isPrimary: existingCount === 0, // first resume becomes primary automatically
    parseStatus: 'pending',
  });

  if (resume.isPrimary) {
    await User.findByIdAndUpdate(req.user._id, { primaryResume: resume._id });
  }

  // Parse asynchronously so the upload response is fast; client polls or
  // re-fetches to see parseStatus flip to 'parsed'.
  parseResumeInBackground(resume._id, req.file.buffer, req.file.mimetype);

  sendSuccess(res, 201, 'Resume uploaded successfully. Parsing in progress.', { resume });
});

async function parseResumeInBackground(resumeId, buffer, mimeType) {
  try {
    const parsed = await resumeParser.parseResume(buffer, mimeType);
    await Resume.findByIdAndUpdate(resumeId, {
      extractedText: parsed.extractedText,
      skills: parsed.skills,
      education: parsed.education,
      experience: parsed.experience,
      projects: parsed.projects,
      certifications: parsed.certifications,
      parseStatus: 'parsed',
    });
  } catch (err) {
    logger.error('Resume parsing failed', { resumeId: resumeId.toString(), error: err.message });
    await Resume.findByIdAndUpdate(resumeId, { parseStatus: 'failed' });
  }
}

const listResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Resumes fetched', { resumes });
});

const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');
  sendSuccess(res, 200, 'Resume fetched', { resume });
});

const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');

  await deleteResumeFile(resume.storageKey);
  await resume.deleteOne();

  if (resume.isPrimary) {
    const nextResume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    await User.findByIdAndUpdate(req.user._id, { primaryResume: nextResume?._id || null });
    if (nextResume) {
      nextResume.isPrimary = true;
      await nextResume.save();
    }
  }

  sendSuccess(res, 200, 'Resume deleted successfully');
});

const setPrimaryResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) throw ApiError.notFound('Resume not found');

  await Resume.updateMany({ user: req.user._id }, { isPrimary: false });
  resume.isPrimary = true;
  await resume.save();
  await User.findByIdAndUpdate(req.user._id, { primaryResume: resume._id });

  sendSuccess(res, 200, 'Primary resume updated', { resume });
});

module.exports = { uploadResume, listResumes, getResume, deleteResume, setPrimaryResume };
