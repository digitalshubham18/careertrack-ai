const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { isDisposableEmail } = require('../utils/disposableEmailDomains');
const otpService = require('../services/otp.service');
const emailService = require('../services/email.service');
const { uploadImageBuffer, deleteImageFile } = require('../config/storage');
const logger = require('../utils/logger');

const getProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Profile fetched', { user: req.user.toSafeObject() });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'phone', 'location', 'github', 'linkedin', 'portfolio', 'skills',
    'experience', 'education', 'preferredRoles', 'preferredLocations', 'expectedSalary',
    'profilePicture',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, 200, 'Profile updated successfully', { user: user.toSafeObject() });
});

const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const allowed = ['newJobs', 'highMatchJobs', 'interviewReminders', 'applicationUpdates'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[`notificationPreferences.${key}`] = Boolean(req.body[key]);
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
  sendSuccess(res, 200, 'Notification preferences updated', { user: user.toSafeObject() });
});

/**
 * Step 1 of email change: verify the requester is really the account owner
 * (current password, checked via the existing bcrypt comparePassword - spec
 * #42), then send an OTP to the NEW address to prove it's real and reachable
 * (spec #41). Both checks are required together - see README for why we
 * don't offer a password-only bypass that would skip proving the new email
 * is real.
 */
const requestEmailChange = asyncHandler(async (req, res) => {
  const { newEmail, currentPassword } = req.body;

  if (isDisposableEmail(newEmail)) {
    throw ApiError.badRequest('Disposable/temporary email addresses are not allowed');
  }

  const normalizedNewEmail = newEmail.toLowerCase().trim();
  if (normalizedNewEmail === req.user.email) {
    throw ApiError.badRequest('This is already your current email address');
  }

  const emailInUse = await User.findOne({ email: normalizedNewEmail });
  if (emailInUse) throw ApiError.conflict('That email address is already associated with an account');

  const user = await User.findById(req.user._id).select(
    '+password +pendingEmail +emailChangeOtpHash +emailChangeOtpExpires +emailChangeAttempts +emailChangeLastSentAt'
  );
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  if (!otpService.canResend(user.emailChangeLastSentAt)) {
    const waitSeconds = otpService.resendWaitSeconds(user.emailChangeLastSentAt);
    throw ApiError.tooMany(`Please wait ${waitSeconds}s before requesting another code`);
  }

  const { code, hash, expiresAt } = otpService.generateOtp();
  user.pendingEmail = normalizedNewEmail;
  user.emailChangeOtpHash = hash;
  user.emailChangeOtpExpires = expiresAt;
  user.emailChangeAttempts = 0;
  user.emailChangeLastSentAt = new Date();
  await user.save();

  const { subject, html, text } = emailService.buildEmailChangeOtpEmail({ name: user.name, otp: code });
  await emailService.sendMail({ to: normalizedNewEmail, subject, html, text });

  logger.info('Email change OTP sent', { userId: user._id.toString() });
  sendSuccess(res, 200, 'Verification code sent to your new email address', {
    newEmail: normalizedNewEmail,
    expiresInMinutes: otpService.OTP_TTL_MS / 60000,
  });
});

const verifyEmailChange = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  const user = await User.findById(req.user._id).select(
    '+pendingEmail +emailChangeOtpHash +emailChangeOtpExpires +emailChangeAttempts'
  );

  if (!user.pendingEmail || !user.emailChangeOtpHash) {
    throw ApiError.badRequest('No pending email change found. Please request a new code.');
  }
  if (user.emailChangeOtpExpires < new Date()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.');
  }
  if (user.emailChangeAttempts >= otpService.MAX_ATTEMPTS) {
    throw ApiError.tooMany('Too many incorrect attempts. Please request a new code.');
  }

  const isValid = otpService.hashOtp(otp) === user.emailChangeOtpHash;
  if (!isValid) {
    user.emailChangeAttempts += 1;
    await user.save();
    const remaining = otpService.MAX_ATTEMPTS - user.emailChangeAttempts;
    throw ApiError.badRequest(`Incorrect code. ${Math.max(0, remaining)} attempt(s) remaining.`);
  }

  // Re-check uniqueness at the moment of commit to close any race window
  // opened between request and verify.
  const emailTaken = await User.findOne({ email: user.pendingEmail, _id: { $ne: user._id } });
  if (emailTaken) throw ApiError.conflict('That email address was just taken by another account');

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  user.emailChangeOtpHash = undefined;
  user.emailChangeOtpExpires = undefined;
  user.emailChangeAttempts = 0;
  user.emailChangeLastSentAt = undefined;
  user.refreshTokenVersion += 1; // invalidate existing sessions tied to the old email identity
  await user.save();

  logger.info('Email changed successfully', { userId: user._id.toString() });
  sendSuccess(res, 200, 'Email address updated successfully', { user: user.toSafeObject() });
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided');

  const user = await User.findById(req.user._id).select('+profilePictureStorageKey');
  const previousStorageKey = user.profilePictureStorageKey;

  const { url, storageKey } = await uploadImageBuffer(req.file.buffer, req.file.originalname, req.user._id.toString());

  user.profilePicture = url;
  user.profilePictureStorageKey = storageKey;
  await user.save();

  if (previousStorageKey) {
    try {
      await deleteImageFile(previousStorageKey);
    } catch (err) {
      logger.warn('Failed to delete old profile picture', { error: err.message });
    }
  }

  sendSuccess(res, 200, 'Profile picture updated', { user: user.toSafeObject() });
});

const removeProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+profilePictureStorageKey');
  if (user.profilePictureStorageKey) {
    try {
      await deleteImageFile(user.profilePictureStorageKey);
    } catch (err) {
      logger.warn('Failed to delete profile picture from storage', { error: err.message });
    }
  }
  user.profilePicture = '';
  user.profilePictureStorageKey = '';
  await user.save();

  sendSuccess(res, 200, 'Profile picture removed', { user: user.toSafeObject() });
});

module.exports = {
  getProfile,
  updateProfile,
  updateNotificationPreferences,
  uploadProfilePicture,
  removeProfilePicture,
  requestEmailChange,
  verifyEmailChange,
};
