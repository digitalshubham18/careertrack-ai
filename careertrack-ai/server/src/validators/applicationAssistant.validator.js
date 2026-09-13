const { z } = require('zod');

const generateDocumentSchema = z.object({
  type: z.enum(['cover_letter', 'recruiter_message', 'linkedin_message', 'follow_up', 'thank_you']),
});

module.exports = { generateDocumentSchema };
