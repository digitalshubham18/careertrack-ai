const { z } = require('zod');

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  status: z.enum(['Watching', 'Applied', 'In Progress', 'Closed']).optional(),
  recruiterName: z.string().optional().or(z.literal('')),
  recruiterEmail: z.string().email().optional().or(z.literal('')),
  recruiterPhone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

const updateCompanySchema = companySchema.partial();

module.exports = { companySchema, updateCompanySchema };
