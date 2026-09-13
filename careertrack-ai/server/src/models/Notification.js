const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'interview_reminder',
        'deadline_reminder',
        'followup_reminder',
        'status_update',
        'resume_analysis_complete',
        'new_job',
        'high_match_job',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication', default: null },
    relatedJobListing: { type: mongoose.Schema.Types.ObjectId, ref: 'JobListing', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
