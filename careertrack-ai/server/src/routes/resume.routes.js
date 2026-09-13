const express = require('express');
const resumeController = require('../controllers/resumeController');
const resumeBuilderController = require('../controllers/resumeBuilderController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
  updateDraftSchema, generateSummarySchema, improveBulletSchema, optimizeKeywordsSchema,
} = require('../validators/resumeBuilder.validator');

const router = express.Router();

router.use(authenticate);
router.post('/', upload.single('resume'), resumeController.uploadResume);
router.get('/', resumeController.listResumes);

// --- Resume Builder (structured, user-authored resumes with AI assist + PDF export) ---
router.post('/builder', resumeBuilderController.createDraft);
router.put('/builder/:id', validate(updateDraftSchema), resumeBuilderController.updateDraft);
router.post('/builder/:id/export', resumeBuilderController.exportPdf);
router.post('/builder/:id/ai/summary', validate(generateSummarySchema), resumeBuilderController.aiGenerateSummary);
router.post('/builder/:id/ai/improve-bullet', validate(improveBulletSchema), resumeBuilderController.aiImproveBullet);
router.post('/builder/:id/ai/optimize-keywords', validate(optimizeKeywordsSchema), resumeBuilderController.aiOptimizeKeywords);

router.get('/:id', resumeController.getResume);
router.delete('/:id', resumeController.deleteResume);
router.put('/:id/primary', resumeController.setPrimaryResume);

module.exports = router;
