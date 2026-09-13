const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { uploadImage } = require('../middleware/uploadImage');
const { profileSchema } = require('../validators/profile.validator');
const {
  requestEmailChangeSchema, verifyEmailChangeSchema, notificationPreferencesSchema,
} = require('../validators/emailChange.validator');

const router = express.Router();

router.use(authenticate);
router.get('/profile', userController.getProfile);
router.put('/profile', validate(profileSchema), userController.updateProfile);
router.put('/notification-preferences', validate(notificationPreferencesSchema), userController.updateNotificationPreferences);

router.post('/profile-picture', uploadImage.single('image'), userController.uploadProfilePicture);
router.delete('/profile-picture', userController.removeProfilePicture);

router.post('/change-email/request', authLimiter, validate(requestEmailChangeSchema), userController.requestEmailChange);
router.post('/change-email/verify', authLimiter, validate(verifyEmailChangeSchema), userController.verifyEmailChange);

module.exports = router;
