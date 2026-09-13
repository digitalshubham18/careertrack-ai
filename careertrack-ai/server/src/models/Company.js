const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    website: { type: String, default: '' },
    location: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Watching', 'Applied', 'In Progress', 'Closed'],
      default: 'Watching',
    },
    recruiterName: { type: String, default: '' },
    recruiterEmail: { type: String, default: '' },
    recruiterPhone: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

companySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Company', companySchema);
