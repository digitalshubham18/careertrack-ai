const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');
const otpService = require('../services/otp.service');

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.refreshTokenVersion },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
}

function setAuthCookies(res, accessToken, refreshToken) {
  const cookieOptions = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
  };
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

/**
 * Generates a random token, stores only its SHA-256 hash on the user
 * document (so a leaked database dump doesn't hand out usable tokens), and
 * returns the raw token to embed in the emailed password-reset link.
 */
function issueHashedToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
}

/**
 * Sends a 6-digit OTP to the account's email for registration verification.
 * Mirrors the email-change OTP flow (same hashing, expiry, attempt-limit,
 * resend-cooldown semantics) for consistency across the app - no link to
 * click, just a code to type in.
 */
async function sendRegistrationOtp(user) {
  const { code, hash, expiresAt } = otpService.generateOtp();
  user.emailVerificationToken = hash;
  user.emailVerificationExpires = expiresAt;
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = new Date();
  await user.save();

  const { subject, html, text } = emailService.buildRegistrationOtpEmail({ name: user.name, otp: code });
  await emailService.sendMail({ to: user.email, subject, html, text });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password });
  await sendRegistrationOtp(user);

  logger.info('User registered - verification OTP sent', { userId: user._id.toString() });

  // Deliberately no access/refresh tokens here: the account cannot be used
  // to log in until the OTP proves the email address is real and reachable.
  sendSuccess(res, 201, 'Account created. Enter the verification code sent to your email to activate it.', {
    email: user.email,
    emailDeliveryConfigured: emailService.isConfigured,
    expiresInMinutes: otpService.OTP_TTL_MS / 60000,
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select(
    '+emailVerificationToken +emailVerificationExpires +emailVerificationAttempts'
  );
  if (!user) throw ApiError.badRequest('No account found for this email');
  if (user.isEmailVerified) throw ApiError.badRequest('This email is already verified');

  if (!user.emailVerificationToken || !user.emailVerificationExpires) {
    throw ApiError.badRequest('No verification code found. Please request a new one.');
  }
  if (user.emailVerificationExpires < new Date()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.');
  }
  if (user.emailVerificationAttempts >= otpService.MAX_ATTEMPTS) {
    throw ApiError.tooMany('Too many incorrect attempts. Please request a new code.');
  }

  const isValid = otpService.hashOtp(otp) === user.emailVerificationToken;
  if (!isValid) {
    user.emailVerificationAttempts += 1;
    await user.save();
    const remaining = otpService.MAX_ATTEMPTS - user.emailVerificationAttempts;
    throw ApiError.badRequest(`Incorrect code. ${Math.max(0, remaining)} attempt(s) remaining.`);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  user.emailVerificationAttempts = 0;
  user.emailVerificationLastSentAt = undefined;
  await user.save();

  // Verification succeeded - log the user in directly for a smooth flow.
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  logger.info('Email verified via OTP', { userId: user._id.toString() });
  sendSuccess(res, 200, 'Email verified successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+emailVerificationLastSentAt');

  // Same response regardless of whether the account exists or is already
  // verified, to avoid leaking which emails are registered - EXCEPT the
  // resend-cooldown check, which only applies when there's actually a
  // pending verification to rate-limit.
  if (user && !user.isEmailVerified) {
    if (!otpService.canResend(user.emailVerificationLastSentAt)) {
      const waitSeconds = otpService.resendWaitSeconds(user.emailVerificationLastSentAt);
      throw ApiError.tooMany(`Please wait ${waitSeconds}s before requesting another code`);
    }
    await sendRegistrationOtp(user);
    logger.info('Verification OTP resent', { userId: user._id.toString() });
  }

  sendSuccess(res, 200, 'If that email exists and is unverified, a new verification code has been sent');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');
  if (!user.isEmailVerified) {
    throw ApiError.forbidden(
      'Please verify your email address before logging in. Check your inbox for the verification code.',
      'EMAIL_NOT_VERIFIED'
    );
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  sendSuccess(res, 200, 'Logged in successfully', {
    user: user.toSafeObject(),
    accessToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  sendSuccess(res, 200, 'Logged out successfully');
});

const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Current user fetched', { user: req.user.toSafeObject() });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub);
  if (!user || user.refreshTokenVersion !== decoded.tokenVersion) {
    throw ApiError.unauthorized('Refresh token no longer valid');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  sendSuccess(res, 200, 'Token refreshed', { accessToken });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way to avoid leaking which emails are registered.
  if (user) {
    const { rawToken, hashedToken } = issueHashedToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + PASSWORD_RESET_TTL_MS;
    await user.save();

    const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
    const { subject, html, text } = emailService.buildPasswordResetEmail({
      name: user.name,
      resetUrl,
    });
    await emailService.sendMail({ to: user.email, subject, html, text });

    logger.info('Password reset email sent', { userId: user._id.toString() });
  }

  sendSuccess(res, 200, 'If that email exists, a password reset link has been sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw ApiError.badRequest('Password reset token is invalid or has expired');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenVersion += 1; // invalidate existing refresh tokens
  await user.save();

  sendSuccess(res, 200, 'Password reset successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  user.refreshTokenVersion += 1;
  await user.save();

  sendSuccess(res, 200, 'Password changed successfully');
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  refresh,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
};
