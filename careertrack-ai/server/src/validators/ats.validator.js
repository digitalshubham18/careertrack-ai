const { z } = require('zod');

const analyzeSchema = z.object({
  resumeId: z.string().min(1, 'resumeId is required'),
  jobDescription: z.string().min(20, 'Job description is too short to analyze'),
  jobApplicationId: z.string().optional().nullable(),
});

module.exports = { analyzeSchema };
