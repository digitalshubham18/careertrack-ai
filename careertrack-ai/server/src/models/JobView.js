const mongoose = require('mongoose');

/**
 * One document per (user, job, calendar day) - lets us count meaningful
 * views (a user looking at a job on a given day) without a page refresh
 * inflating the counter indefinitely.
 */
const jobViewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobListing: { type: mongoose.Schema.Types.ObjectId, ref: 'JobListing', required: true },
    viewDate: { type: String, required: true }, // 'YYYY-MM-DD'
  },
  { timestamps: true }
);

jobViewSchema.index({ user: 1, jobListing: 1, viewDate: 1 }, { unique: true });

module.exports = mongoose.model('JobView', jobViewSchema);
