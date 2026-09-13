const express = require('express');
const jobListingController = require('../controllers/jobListingController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { matchJobSchema } = require('../validators/jobMatch.validator');

const router = express.Router();

router.use(authenticate);

// Specific feed routes must come before the generic '/:id' route.
router.get('/new', jobListingController.getNewJobs);
router.get('/closing-soon', jobListingController.getClosingSoon);
router.get('/remote', jobListingController.getRemoteJobs);
router.get('/sde', jobListingController.getSdeJobs);
router.get('/recommended', jobListingController.getRecommendedJobs);
router.get('/saved', jobListingController.getSavedJobs);
router.get('/applied', jobListingController.getAppliedJobs);

router.get('/', jobListingController.listJobs);
router.get('/:id', jobListingController.getJobById);
router.post('/:id/save', jobListingController.saveJob);
router.delete('/:id/save', jobListingController.unsaveJob);
router.post('/:id/apply', jobListingController.applyToJob);
router.post('/:id/match', validate(matchJobSchema), jobListingController.matchJob);

module.exports = router;
