const { z } = require('zod');

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  github: z.string().optional().or(z.literal('')),
  linkedin: z.string().optional().or(z.literal('')),
  portfolio: z.string().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.object({
    title: z.string().optional(),
    company: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    field: z.string().optional(),
    startYear: z.number().optional(),
    endYear: z.number().optional(),
  })).optional(),
  preferredRoles: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  expectedSalary: z.string().optional().or(z.literal('')),
});

module.exports = { profileSchema };
