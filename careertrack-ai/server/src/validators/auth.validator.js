const { z } = require('zod');
const { isDisposableEmail } = require('../utils/disposableEmailDomains');

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z
    .string()
    .email()
    .refine((email) => !isDisposableEmail(email), {
      message: 'Disposable/temporary email addresses are not allowed. Please use a real email address.',
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'Enter the 6-digit code'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
};
