const { z } = require('zod');
const DsaEntry = require('../models/DsaEntry');

const logEntrySchema = z.object({
  topic: z.enum(DsaEntry.TOPICS),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  title: z.string().min(1, 'Problem title is required'),
  notes: z.string().optional().or(z.literal('')),
});

const updateGoalSchema = z.object({
  dailyGoal: z.number().int().min(1).max(50),
});

module.exports = { logEntrySchema, updateGoalSchema };
