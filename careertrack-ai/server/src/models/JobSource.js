const mongoose = require('mongoose');

/**
 * Configuration + running stats for one job source. No secrets are stored
 * here: the two built-in providers (Remotive, Greenhouse job board API) are
 * public, unauthenticated APIs, so `config` only ever holds non-sensitive
 * values (e.g. a Greenhouse company board token, which is a public
 * identifier, not a credential; or an admin-supplied public feed URL).
 * If a future provider genuinely requires a secret key, it should be read
 * from a server-side environment variable referenced by name here, never
 * stored in the database in plaintext.
 */
const jobSourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Remotive", "Greenhouse - Acme Inc"
    type: { type: String, enum: ['admin', 'remotive', 'greenhouse', 'rss'], required: true, index: true },
    enabled: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },

    isSyncing: { type: Boolean, default: false }, // overlap-prevention flag

    lastSyncAt: { type: Date, default: null },
    lastSuccessAt: { type: Date, default: null },
    lastErrorAt: { type: Date, default: null },
    lastErrorMessage: { type: String, default: '' },

    jobsFetched: { type: Number, default: 0 },
    jobsCreated: { type: Number, default: 0 },
    jobsUpdated: { type: Number, default: 0 },
    duplicatesSkipped: { type: Number, default: 0 },
    jobsInvalid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSourceSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('JobSource', jobSourceSchema);
