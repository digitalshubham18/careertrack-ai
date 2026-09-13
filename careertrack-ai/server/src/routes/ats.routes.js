const express = require('express');
const atsController = require('../controllers/atsController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { analyzeSchema } = require('../validators/ats.validator');

const router = express.Router();

router.use(authenticate);
router.post('/analyze', validate(analyzeSchema), atsController.analyzeResume);
router.get('/resume/:resumeId', atsController.listAnalysesForResume);
router.get('/:id', atsController.getAnalysis);

module.exports = router;
