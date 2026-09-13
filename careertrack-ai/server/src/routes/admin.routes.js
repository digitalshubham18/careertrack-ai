const express = require('express');
const adminController = require('../controllers/adminController');
const adminJobSourceController = require('../controllers/adminJobSourceController');
const adminJobListingController = require('../controllers/adminJobListingController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createJobSourceSchema, updateJobSourceSchema } = require('../validators/jobSource.validator');
const { createJobListingSchema, updateJobListingSchema } = require('../validators/jobListing.validator');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/users', adminController.listUsers);
router.put('/users/:id/toggle-active', adminController.toggleUserActive);
router.get('/analytics', adminController.getPlatformAnalytics);

// --- Job sources (spec #8/#9: enable/disable/configure/test/sync/logs) ---
router.get('/job-sources', adminJobSourceController.listSources);
router.post('/job-sources', validate(createJobSourceSchema), adminJobSourceController.createSource);
router.patch('/job-sources/:id', validate(updateJobSourceSchema), adminJobSourceController.updateSource);
router.delete('/job-sources/:id', adminJobSourceController.deleteSource);
router.post('/job-sources/:id/sync', adminJobSourceController.syncOne);
router.post('/job-sources/sync-all', adminJobSourceController.syncAll);
router.get('/job-sync-logs', adminJobSourceController.listSyncLogs);

// --- Admin-published job listings + platform-wide job management ---
router.get('/job-listings', adminJobListingController.listAllJobs);
router.get('/job-listings/analytics', adminJobListingController.getJobAnalytics);
router.post('/job-listings', validate(createJobListingSchema), adminJobListingController.createJob);
router.patch('/job-listings/:id', validate(updateJobListingSchema), adminJobListingController.updateJob);
router.patch('/job-listings/:id/publish', adminJobListingController.publishJob);
router.patch('/job-listings/:id/close', adminJobListingController.closeJob);
router.delete('/job-listings/:id', adminJobListingController.deleteJob);

module.exports = router;
