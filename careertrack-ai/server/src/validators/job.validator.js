const { z } = require('zod');
const JobApplication = require('../models/JobApplication');

const jobApplicationSchema = z.object({
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  jobUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote']).optional(),
  salaryRange: z.string().optional().or(z.literal('')),
  jobDescription: z.string().optional().or(z.literal('')),
  applicationDate: z.string().optional(),
  deadline: z.string().optional().nullable(),
  status: z.enum(JobApplication.STATUSES).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  contactPerson: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  resumeUsed: z.string().optional().nullable(),
  interviewDate: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
  status: z.enum(JobApplication.STATUSES),
});

module.exports = { jobApplicationSchema, updateStatusSchema };
