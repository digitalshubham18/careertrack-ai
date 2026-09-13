const { z } = require('zod');
const JobListing = require('../models/JobListing');

const createJobListingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  companyLogo: z.string().optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required'),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
  experience: z.string().optional().or(z.literal('')),
  salary: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  workMode: z.enum(['Remote', 'Hybrid', 'On-site']).optional(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Internship', 'Contract']).optional(),
  category: z.enum(JobListing.CATEGORIES).optional(),
  applicationUrl: z.string().url('Enter a valid application URL'),
  openings: z.number().int().positive().optional(),
  deadline: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});

const updateJobListingSchema = createJobListingSchema.partial();

module.exports = { createJobListingSchema, updateJobListingSchema };
