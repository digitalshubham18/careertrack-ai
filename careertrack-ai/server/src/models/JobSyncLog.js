const mongoose = require('mongoose');

const jobSyncLogSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    status: { type: String, enum: ['success', 'partial', 'failed'], required: true },
    fetched: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    invalid: { type: Number, default: 0 },
    errorMessage: { type: String, default: '' },
    triggeredBy: { type: String, enum: ['scheduled', 'manual'], default: 'scheduled' },
  },
  { timestamps: true }
);

jobSyncLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('JobSyncLog', jobSyncLogSchema);
