/**
 * JobProvider — base class for every job source.
 *
 * Adding a new source means creating a subclass and implementing
 * `fetchRawJobs()` + `normalizeJob()`; nothing else in the aggregation
 * pipeline (jobAggregator.service.js) needs to change.
 *
 * Every concrete provider in this codebase only talks to sources that are
 * public, documented, unauthenticated (or use a public non-secret board
 * token) APIs explicitly intended for external consumption — never scraping
 * a page that prohibits it, never bypassing auth/CAPTCHA/anti-bot systems.
 */
class JobProvider {
  constructor(config = {}) {
    this.config = config;
  }

  /** Machine-readable source identifier - must match JobListing.source enum. */
  getSourceName() {
    throw new Error('getSourceName() must be implemented by the provider');
  }

  /** Fetches raw job records from the external source, provider-specific shape. */
  // eslint-disable-next-line class-methods-use-this
  async fetchRawJobs() {
    throw new Error('fetchRawJobs() must be implemented by the provider');
  }

  /** Converts one raw provider record into the common JobListing shape. */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  normalizeJob(raw) {
    throw new Error('normalizeJob() must be implemented by the provider');
  }

  /** Minimal structural validation shared by all providers before persisting. */
  // eslint-disable-next-line class-methods-use-this
  validateJob(job) {
    return Boolean(
      job &&
        job.title &&
        job.title.trim().length > 0 &&
        job.companyName &&
        job.companyName.trim().length > 0 &&
        job.description &&
        job.description.trim().length > 0 &&
        job.applicationUrl &&
        /^https?:\/\//.test(job.applicationUrl) &&
        job.sourceJobId
    );
  }

  /** Fetches + normalizes + validates in one call; invalid records are dropped, not thrown. */
  async fetchJobs() {
    const raw = await this.fetchRawJobs();
    const normalized = raw.map((r) => {
      try {
        return this.normalizeJob(r);
      } catch (err) {
        return null;
      }
    });
    return normalized.filter((job) => job && this.validateJob(job));
  }
}

module.exports = JobProvider;
