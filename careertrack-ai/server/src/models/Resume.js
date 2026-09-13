const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    storageUrl: { type: String, default: '' },
    storageKey: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },

    // 'uploaded' = a PDF/DOCX file the user uploaded and we parsed.
    // 'builder' = structured data the user authored in the Resume Builder;
    // storageUrl/storageKey/mimeType are populated once a PDF is exported.
    origin: { type: String, enum: ['uploaded', 'builder'], default: 'uploaded' },

    extractedText: { type: String, default: '' },

    summary: { type: String, default: '' },
    skills: [{ type: String, trim: true }],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        year: String,
      },
    ],
    experience: [
      {
        title: String,
        company: String,
        duration: String,
        description: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
      },
    ],
    certifications: [{ type: String, trim: true }],
    achievements: [{ type: String, trim: true }],

    isPrimary: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    parseStatus: {
      type: String,
      enum: ['pending', 'parsed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, isPrimary: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
