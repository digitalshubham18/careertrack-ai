const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Email Service
 * -------------
 * Sends real email via SMTP when SMTP_* env vars are configured. If they are
 * not configured (e.g. local/demo environments), emails are logged instead of
 * silently dropped, so the verification/reset flow is still visible and
 * testable without a mail provider.
 *
 * IMPORTANT: In this fallback ("logged") mode, the verification link is only
 * visible in the server console/logs - it is NOT delivered to the user's
 * inbox. Configure real SMTP credentials before relying on email
 * verification to prove an address is real in production.
 */

const isConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

async function sendMail({ to, subject, html, text }) {
  if (!isConfigured) {
    logger.warn('SMTP not configured - email NOT actually delivered. Logging content instead.', {
      to,
      subject,
      preview: text || html?.replace(/<[^>]+>/g, ' ').slice(0, 300),
    });
    return { delivered: false };
  }

  await transporter.sendMail({
    from: env.smtp.fromAddress,
    to,
    subject,
    html,
    text,
  });
  return { delivered: true };
}

function buildVerificationEmail({ name, verificationUrl }) {
  return {
    subject: 'Verify your email — CareerTrack AI',
    text: `Hi ${name},\n\nPlease verify your email address by visiting:\n${verificationUrl}\n\nThis link expires in 24 hours. If you didn't create a CareerTrack AI account, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#4F3CC9;">Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Thanks for signing up for CareerTrack AI. Please confirm this is your email address to activate your account:</p>
        <p><a href="${verificationUrl}" style="display:inline-block;background:#4F3CC9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Verify email</a></p>
        <p style="color:#666;font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  };
}

function buildPasswordResetEmail({ name, resetUrl }) {
  return {
    subject: 'Reset your password — CareerTrack AI',
    text: `Hi ${name},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#4F3CC9;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#4F3CC9;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset password</a></p>
        <p style="color:#666;font-size:13px;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}

function buildRegistrationOtpEmail({ name, otp }) {
  return {
    subject: 'Verify your email — CareerTrack AI',
    text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nEnter this code in the app to activate your account. This code expires in 10 minutes. If you didn't create a CareerTrack AI account, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#4F3CC9;">Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Thanks for signing up for CareerTrack AI. Enter this code in the app to activate your account:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#4F3CC9;">${otp}</p>
        <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `,
  };
}

function buildEmailChangeOtpEmail({ name, otp }) {
  return {
    subject: 'Your email change verification code — CareerTrack AI',
    text: `Hi ${name},\n\nYour verification code is: ${otp}\n\nEnter this code to confirm your new email address. This code expires in 10 minutes. If you didn't request this, you can ignore this email and your account will remain unchanged.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#4F3CC9;">Confirm your new email</h2>
        <p>Hi ${name},</p>
        <p>Enter this code to confirm this is your new email address:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#4F3CC9;">${otp}</p>
        <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email — your account will remain unchanged.</p>
      </div>
    `,
  };
}

module.exports = {
  sendMail, buildVerificationEmail, buildPasswordResetEmail, buildEmailChangeOtpEmail, buildRegistrationOtpEmail, isConfigured,
};
