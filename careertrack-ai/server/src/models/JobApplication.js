const mongoose = require('mongoose');

const STATUSES = [
  'Saved',
  'Applied',
  'Shortlisted',
  'OA',
  'Interview',
  'Technical Interview',
  'HR Interview',
  'Final Round',
  'Offer',
  'Rejected',
  'Withdrawn',
];

const jobApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    companyName: { type: String, required: true, trim: true },
    jobTitle: { type: String, required: true, trim: true },
    jobUrl: { type: String, trim: true },
    location: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'],
      default: 'Full-time',
    },
    salaryRange: { type: String, trim: true },
    jobDescription: { type: String, default: '' },

    applicationDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    status: { type: String, enum: STATUSES, default: 'Saved', index: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },

    contactPerson: { type: String, trim: true },
    contactEmail: { type: String, trim: true },
    notes: { type: String, default: '' },

    resumeUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    atsScore: { type: Number, min: 0, max: 100, default: null },
    latestAtsAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: 'ATSAnalysis', default: null },
    sourceListing: { type: mongoose.Schema.Types.ObjectId, ref: 'JobListing', default: null },

    interviewDate: { type: Date },
    followUpDate: { type: Date },

    generatedDocuments: [
      {
        type: {
          type: String,
          enum: ['cover_letter', 'recruiter_message', 'linkedin_message', 'follow_up', 'thank_you'],
          required: true,
        },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

jobApplicationSchema.index({ user: 1, status: 1 });
jobApplicationSchema.index({ user: 1, companyName: 1, jobTitle: 1 });

jobApplicationSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
