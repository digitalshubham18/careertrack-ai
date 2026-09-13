const { z } = require('zod');

const createJobSourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['remotive', 'greenhouse', 'rss']),
  config: z.record(z.any()).optional().default({}),
  enabled: z.boolean().optional(),
});

const updateJobSourceSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
  enabled: z.boolean().optional(),
});

module.exports = { createJobSourceSchema, updateJobSourceSchema };
