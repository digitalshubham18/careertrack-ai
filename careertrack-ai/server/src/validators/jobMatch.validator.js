const { z } = require('zod');

const matchJobSchema = z.object({
  resumeId: z.string().optional(),
});

module.exports = { matchJobSchema };
