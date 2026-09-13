const mongoose = require('mongoose');

const DSA_TOPICS = [
  'Arrays', 'Strings', 'Linked Lists', 'Stack', 'Queue', 'Hashing', 'Binary Search',
  'Trees', 'BST', 'Heap', 'Graphs', 'Recursion', 'Backtracking', 'Greedy',
  'Dynamic Programming', 'Bit Manipulation',
];

const dsaEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, enum: DSA_TOPICS, required: true, index: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    solvedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

dsaEntrySchema.index({ user: 1, solvedAt: -1 });
dsaEntrySchema.statics.TOPICS = DSA_TOPICS;

module.exports = mongoose.model('DsaEntry', dsaEntrySchema);
