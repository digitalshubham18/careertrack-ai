const JobListing = require('../../models/JobListing');

const DUPLICATE_WINDOW_DAYS = 45; // don't match against very old postings from a different source

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompany(company) {
  return company.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Finds an existing JobListing that represents the SAME real-world job as
 * `normalizedJob`, using two signals in order:
 *
 *   1. Exact match on (source, sourceJobId) - this is the same job the same
 *      provider already gave us before; treat as an update, not a new job.
 *   2. Cross-source match on (normalized company + normalized title +
 *      location), restricted to postings published in the last
 *      DUPLICATE_WINDOW_DAYS days - this catches the same job appearing
 *      through two different providers (e.g. a company's own Greenhouse
 *      board AND a Remotive listing for the same role).
 *
 * Returns the existing document, or null if this is a genuinely new job.
 */
async function findExistingListing(normalizedJob) {
  const sameSourceMatch = await JobListing.findOne({
    source: normalizedJob.source,
    sourceJobId: normalizedJob.sourceJobId,
  });
  if (sameSourceMatch) return { existing: sameSourceMatch, matchType: 'same_source' };

  const cutoff = new Date(Date.now() - DUPLICATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const crossSourceMatch = await JobListing.findOne({
    normalizedTitle: normalizeTitle(normalizedJob.title),
    normalizedCompany: normalizeCompany(normalizedJob.companyName),
    publishedAt: { $gte: cutoff },
    source: { $ne: normalizedJob.source },
  });
  if (crossSourceMatch) return { existing: crossSourceMatch, matchType: 'cross_source' };

  return null;
}

module.exports = { findExistingListing, normalizeTitle, normalizeCompany };
