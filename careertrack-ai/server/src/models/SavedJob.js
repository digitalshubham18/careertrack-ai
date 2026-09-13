const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobListing: { type: mongoose.Schema.Types.ObjectId, ref: 'JobListing', required: true, index: true },
  },
  { timestamps: true }
);

savedJobSchema.index({ user: 1, jobListing: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);
