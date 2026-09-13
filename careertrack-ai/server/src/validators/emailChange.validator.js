const { z } = require('zod');

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email('Enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

const verifyEmailChangeSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit code'),
});

const notificationPreferencesSchema = z.object({
  newJobs: z.boolean().optional(),
  highMatchJobs: z.boolean().optional(),
  interviewReminders: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
});

module.exports = { requestEmailChangeSchema, verifyEmailChangeSchema, notificationPreferencesSchema };
