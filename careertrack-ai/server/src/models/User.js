const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false }, // stores the SHA-256 hash of the current OTP
    emailVerificationExpires: { type: Date, select: false },
    emailVerificationAttempts: { type: Number, default: 0, select: false },
    emailVerificationLastSentAt: { type: Date, select: false },

    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    profilePicture: { type: String, default: '' },
    profilePictureStorageKey: { type: String, default: '', select: false },

    skills: [{ type: String, trim: true }],
    experience: [
      {
        title: String,
        company: String,
        startDate: Date,
        endDate: Date,
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startYear: Number,
        endYear: Number,
      },
    ],

    preferredRoles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    expectedSalary: { type: String, trim: true },

    primaryResume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    dsaDailyGoal: { type: Number, default: 3, min: 1, max: 50 },

    notificationPreferences: {
      newJobs: { type: Boolean, default: true },
      highMatchJobs: { type: Boolean, default: true },
      interviewReminders: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
    },

    pendingEmail: { type: String, default: null, select: false },
    emailChangeOtpHash: { type: String, select: false },
    emailChangeOtpExpires: { type: Date, select: false },
    emailChangeAttempts: { type: Number, default: 0, select: false },
    emailChangeLastSentAt: { type: Date, select: false },

    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.refreshTokenVersion;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.emailVerificationAttempts;
  delete obj.emailVerificationLastSentAt;
  delete obj.emailChangeOtpHash;
  delete obj.emailChangeOtpExpires;
  delete obj.emailChangeAttempts;
  delete obj.emailChangeLastSentAt;
  delete obj.profilePictureStorageKey;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
