const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

/** Generates a random 6-digit numeric OTP and its SHA-256 hash (only the hash is ever stored). */
function generateOtp() {
  const code = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  return { code, hash, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function canResend(lastSentAt) {
  if (!lastSentAt) return true;
  return Date.now() - new Date(lastSentAt).getTime() >= RESEND_COOLDOWN_MS;
}

function resendWaitSeconds(lastSentAt) {
  if (!lastSentAt) return 0;
  const elapsed = Date.now() - new Date(lastSentAt).getTime();
  return Math.max(0, Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000));
}

module.exports = { generateOtp, hashOtp, canResend, resendWaitSeconds, MAX_ATTEMPTS, OTP_TTL_MS, RESEND_COOLDOWN_MS };
