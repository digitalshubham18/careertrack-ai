const mongoose = require('mongoose');

const atsAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    jobApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication', default: null },

    jobDescriptionSnapshot: { type: String, required: true },

    scores: {
      keywordMatch: { type: Number, min: 0, max: 100, required: true },
      skillsMatch: { type: Number, min: 0, max: 100, required: true },
      experienceMatch: { type: Number, min: 0, max: 100, required: true },
      educationMatch: { type: Number, min: 0, max: 100, required: true },
      formatting: { type: Number, min: 0, max: 100, required: true },
      overall: { type: Number, min: 0, max: 100, required: true },
    },

    matchedSkills: [String],
    missingSkills: [String],
    matchedKeywords: [String],
    missingKeywords: [String],

    jobRequirements: {
      requiredSkills: [String],
      preferredSkills: [String],
      experienceYears: { type: Number, default: null },
      educationLevel: { type: String, default: null },
      seniority: { type: String, default: null },
    },

    recommendations: [String],
    aiSummary: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ATSAnalysis', atsAnalysisSchema);
