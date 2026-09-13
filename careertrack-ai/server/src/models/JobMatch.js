const mongoose = require('mongoose');

/**
 * Cached AI/deterministic match result between one user (via a specific
 * resume) and one job listing, so re-rendering a feed doesn't recompute
 * scoring on every request. Recomputed on demand (new resume, explicit
 * refresh) or when the underlying listing changes materially.
 */
const jobMatchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobListing: { type: mongoose.Schema.Types.ObjectId, ref: 'JobListing', required: true, index: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },

    overallScore: { type: Number, min: 0, max: 100, required: true },
    scores: {
      skills: { type: Number, min: 0, max: 100, required: true },
      experience: { type: Number, min: 0, max: 100, required: true },
      location: { type: Number, min: 0, max: 100, required: true },
      education: { type: Number, min: 0, max: 100, required: true },
    },
    matchedSkills: [String],
    missingSkills: [String],
    recommendations: [String],
  },
  { timestamps: true }
);

jobMatchSchema.index({ user: 1, jobListing: 1 }, { unique: true });

module.exports = mongoose.model('JobMatch', jobMatchSchema);
