const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['Technical', 'Behavioral', 'Company/Role'],
      required: true,
    },
    topic: { type: String, default: '' },
    question: { type: String, required: true },
    userAnswer: { type: String, default: '' },
    evaluation: {
      technicalAccuracy: { type: Number, min: 0, max: 10 },
      communication: { type: Number, min: 0, max: 10 },
      relevance: { type: Number, min: 0, max: 10 },
      completeness: { type: Number, min: 0, max: 10 },
      confidence: { type: Number, min: 0, max: 10 },
      structure: { type: Number, min: 0, max: 10 },
      score: { type: Number, min: 0, max: 10 },
      feedback: { type: String, default: '' },
      improvedAnswer: { type: String, default: '' },
    },
    answeredAt: { type: Date, default: null },
  },
  { _id: true }
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
      required: true,
      index: true,
    },
    questions: [questionSchema],
    status: { type: String, enum: ['generated', 'in_progress', 'completed'], default: 'generated' },
    averageScore: { type: Number, min: 0, max: 10, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
