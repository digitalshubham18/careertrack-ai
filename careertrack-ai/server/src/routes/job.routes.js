const express = require('express');
const jobController = require('../controllers/jobController');
const interviewController = require('../controllers/interviewController');
const applicationAssistantController = require('../controllers/applicationAssistantController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { jobApplicationSchema, updateStatusSchema } = require('../validators/job.validator');
const { generateDocumentSchema } = require('../validators/applicationAssistant.validator');

const router = express.Router();

router.use(authenticate);
router.post('/', validate(jobApplicationSchema), jobController.createApplication);
router.get('/', jobController.listApplications);
router.get('/:id', jobController.getApplication);
router.put('/:id', jobController.updateApplication);
router.patch('/:id/status', validate(updateStatusSchema), jobController.updateStatus);
router.patch('/:id/notes', jobController.addNote);
router.delete('/:id', jobController.deleteApplication);

router.post('/:id/interview', interviewController.generateQuestions);
router.get('/:id/interview', interviewController.getInterview);
router.post('/:id/interview/answer', interviewController.submitAnswer);

router.post('/:id/assistant', validate(generateDocumentSchema), applicationAssistantController.generateDocument);
router.get('/:id/assistant', applicationAssistantController.listDocuments);

module.exports = router;
