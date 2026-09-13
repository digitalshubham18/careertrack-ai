const mongoose = require('mongoose');

/**
 * JobListing represents a single job posting visible to ALL users -
 * distinct from `JobApplication`, which tracks one user's personal progress
 * against a job they're pursuing. A JobApplication can optionally reference
 * a JobListing (see JobApplication.sourceListing) once that linkage is
 * created via "Apply" on a listing, but JobListing itself is never
 * duplicated per-user - there is exactly one document per real-world job,
 * regardless of how many users view/save/apply to it.
 */

const CATEGORIES = [
  'Frontend', 'Backend', 'Full Stack', 'SDE', 'AI/ML', 'Data Science',
  'DevOps', 'Cloud', 'Cybersecurity', 'Mobile', 'QA', 'Product', 'Internship', 'Other',
];

const jobListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    normalizedTitle: { type: String, required: true, index: true }, // lowercased, trimmed, whitespace-collapsed - used for dedup matching
    companyName: { type: String, required: true, trim: true, index: true },
    normalizedCompany: { type: String, required: true, index: true }, // lowercased/stripped - used for dedup matching
    companyLogo: { type: String, default: '' },

    description: { type: String, required: true },
    requiredSkills: [{ type: String, trim: true }],
    preferredSkills: [{ type: String, trim: true }],
    experience: { type: String, default: '' }, // free text, e.g. "2-4 years"
    experienceYears: { type: Number, default: null }, // parsed minimum, used for matching

    salary: { type: String, default: '' },
    location: { type: String, default: '', index: true },
    workMode: { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'On-site' },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
      default: 'Full-time',
    },
    category: { type: String, enum: CATEGORIES, default: 'Other', index: true },

    applicationUrl: { type: String, required: true },

    // --- Provenance / source tracking (never duplicate a job per source) ---
    source: { type: String, enum: ['admin', 'remotive', 'greenhouse', 'rss'], required: true, index: true },
    sourceJobId: { type: String, required: true }, // provider's own id for this job, or a generated id for admin jobs
    sourceName: { type: String, default: '' }, // human-readable, e.g. "Greenhouse - Acme Inc"
    // When the same real-world job is independently discovered from another
    // source, we don't create a second JobListing - we record it here so
    // attribution to every contributing source is preserved (spec #12/#13).
    alternateSources: [
      {
        source: String,
        sourceJobId: String,
        sourceName: String,
        firstSeenAt: { type: Date, default: Date.now },
      },
    ],

    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'EXPIRED'],
      default: 'DRAFT',
      index: true,
    },
    openings: { type: Number, default: 1 },
    deadline: { type: Date, default: null },

    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now }, // updated every sync run the job is still found in
    lastUpdatedAt: { type: Date, default: Date.now }, // updated only when meaningful fields change
    publishedAt: { type: Date, default: Date.now },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // set for admin-created jobs

    viewCount: { type: Number, default: 0 },
    saveCount: { type: Number, default: 0 },
    applyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Fast path for provider upserts: a given source's job id must be unique per source.
jobListingSchema.index({ source: 1, sourceJobId: 1 }, { unique: true });
// Cross-source duplicate detection signature (see jobDeduplication.service.js).
jobListingSchema.index({ normalizedCompany: 1, normalizedTitle: 1, location: 1 });
// Common listing-page queries.
jobListingSchema.index({ status: 1, publishedAt: -1 });
jobListingSchema.index({ title: 'text', description: 'text', companyName: 'text' });

jobListingSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('JobListing', jobListingSchema);
