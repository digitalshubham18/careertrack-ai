const { z } = require('zod');

const updateDraftSchema = z.object({
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    field: z.string().optional(),
    year: z.string().optional(),
  })).optional(),
  experience: z.array(z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    duration: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    technologies: z.array(z.string()).optional(),
  })).optional(),
  certifications: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

const generateSummarySchema = z.object({
  targetRole: z.string().optional(),
});

const improveBulletSchema = z.object({
  text: z.string().min(1, 'text is required'),
  context: z.string().optional(),
});

const optimizeKeywordsSchema = z.object({
  jobDescription: z.string().min(10, 'jobDescription is too short'),
});

module.exports = { updateDraftSchema, generateSummarySchema, improveBulletSchema, optimizeKeywordsSchema };
