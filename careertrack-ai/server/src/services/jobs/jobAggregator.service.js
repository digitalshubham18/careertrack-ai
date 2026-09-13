const JobListing = require('../../models/JobListing');
const JobSource = require('../../models/JobSource');
const JobSyncLog = require('../../models/JobSyncLog');
const { createProvider } = require('./providers/providerFactory');
const { findExistingListing, normalizeTitle, normalizeCompany } = require('./jobDeduplication.service');
const { categorizeJob } = require('./jobCategorization.service');
const { matchNewListingToUsers } = require('./jobMatching.service');
const logger = require('../../utils/logger');

const STALE_GRACE_HOURS = 48; // a job not re-seen for this long is considered gone from the source

/**
 * Fields we treat as "meaningful" for update-tracking (lastUpdatedAt only
 * bumps when one of these actually changes, per spec #13).
 */
const TRACKED_FIELDS = ['description', 'salary', 'location', 'requiredSkills', 'deadline', 'applicationUrl', 'status'];

function hasMeaningfulChange(existing, incoming) {
  return TRACKED_FIELDS.some((field) => {
    const a = JSON.stringify(existing[field] ?? null);
    const b = JSON.stringify(incoming[field] ?? null);
    return a !== b;
  });
}

/**
 * Syncs a single JobSource: fetch -> validate -> dedupe -> categorize ->
 * persist -> mark stale listings from this source as expired. Prevents
 * overlapping runs of the SAME source via the isSyncing flag; different
 * sources may sync concurrently.
 */
async function syncSource(jobSource, { triggeredBy = 'scheduled', io = null } = {}) {
  if (jobSource.isSyncing) {
    logger.warn('Skipping sync - already in progress for this source', { source: jobSource.name });
    return null;
  }

  const startedAt = new Date();
  jobSource.isSyncing = true;
  await jobSource.save();

  const stats = { fetched: 0, created: 0, updated: 0, duplicates: 0, invalid: 0 };
  const seenSourceJobIds = [];
  let errorMessage = '';
  const newlyCreatedListings = [];

  try {
    const provider = createProvider(jobSource);
    const normalizedJobs = await provider.fetchJobs(); // already validated by the base class
    stats.fetched = normalizedJobs.length;

    for (const job of normalizedJobs) {
      seenSourceJobIds.push(job.sourceJobId);

      const match = await findExistingListing(job);

      if (!match) {
        const created = await JobListing.create({
          ...job,
          normalizedTitle: normalizeTitle(job.title),
          normalizedCompany: normalizeCompany(job.companyName),
          category: categorizeJob(job.title, job.description),
          status: 'PUBLISHED', // automatic imports go live without admin approval, per spec
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          lastUpdatedAt: new Date(),
        });
        stats.created += 1;
        newlyCreatedListings.push(created);
        continue;
      }

      const { existing, matchType } = match;

      if (matchType === 'cross_source') {
        stats.duplicates += 1;
        const alreadyLinked = existing.alternateSources.some(
          (alt) => alt.source === job.source && alt.sourceJobId === job.sourceJobId
        );
        if (!alreadyLinked) {
          existing.alternateSources.push({
            source: job.source,
            sourceJobId: job.sourceJobId,
            sourceName: job.sourceName,
          });
        }
        existing.lastSeenAt = new Date();
        await existing.save();
        continue;
      }

      // Same-source match: this is an update to a job we already track.
      const changed = hasMeaningfulChange(existing, job);
      existing.description = job.description;
      existing.salary = job.salary;
      existing.location = job.location;
      existing.requiredSkills = job.requiredSkills;
      existing.applicationUrl = job.applicationUrl;
      existing.lastSeenAt = new Date();
      if (changed) {
        existing.lastUpdatedAt = new Date();
        stats.updated += 1;
      }
      await existing.save();
    }

    // Expire listings from this source that weren't seen in this run and
    // have been stale for longer than the grace period (avoids flapping on
    // a transient provider hiccup or a partial page of results).
    const staleCutoff = new Date(Date.now() - STALE_GRACE_HOURS * 60 * 60 * 1000);
    await JobListing.updateMany(
      {
        source: jobSource.type,
        status: 'PUBLISHED',
        sourceJobId: { $nin: seenSourceJobIds },
        lastSeenAt: { $lt: staleCutoff },
      },
      { $set: { status: 'EXPIRED' } }
    );

    jobSource.lastSuccessAt = new Date();
  } catch (err) {
    errorMessage = err.message;
    jobSource.lastErrorAt = new Date();
    jobSource.lastErrorMessage = err.message;
    logger.error('Job source sync failed', { source: jobSource.name, error: err.message });
  } finally {
    jobSource.isSyncing = false;
    jobSource.lastSyncAt = new Date();
    jobSource.jobsFetched += stats.fetched;
    jobSource.jobsCreated += stats.created;
    jobSource.jobsUpdated += stats.updated;
    jobSource.duplicatesSkipped += stats.duplicates;
    jobSource.jobsInvalid += stats.invalid;
    await jobSource.save();
  }

  const finishedAt = new Date();
  await JobSyncLog.create({
    source: jobSource.name,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    status: errorMessage ? 'failed' : 'success',
    fetched: stats.fetched,
    created: stats.created,
    updated: stats.updated,
    duplicates: stats.duplicates,
    invalid: stats.invalid,
    errorMessage,
    triggeredBy,
  });

  // Fire-and-forget: compute matches + notify strongly-matched users for
  // every newly created listing. Errors here must never fail the sync.
  if (newlyCreatedListings.length) {
    matchNewListingToUsers(newlyCreatedListings, io).catch((err) =>
      logger.error('Post-sync job matching failed', { error: err.message })
    );
  }

  return { ...stats, durationMs: finishedAt - startedAt, error: errorMessage || null };
}

/** Expires PUBLISHED listings whose deadline has passed, across all sources. */
async function expireByDeadline() {
  const result = await JobListing.updateMany(
    { status: 'PUBLISHED', deadline: { $ne: null, $lt: new Date() } },
    { $set: { status: 'EXPIRED' } }
  );
  return result.modifiedCount || 0;
}

/** Syncs every enabled JobSource. Used by both the scheduled job and "Sync All". */
async function syncAllEnabledSources({ triggeredBy = 'scheduled', io = null } = {}) {
  const sources = await JobSource.find({ enabled: true });
  const results = [];
  for (const source of sources) {
    // Sequential on purpose: keeps us well under any provider's rate limits
    // and avoids many concurrent outbound requests from a single sync tick.
    // eslint-disable-next-line no-await-in-loop
    const result = await syncSource(source, { triggeredBy, io });
    results.push({ source: source.name, result });
  }
  const expiredCount = await expireByDeadline();
  return { results, expiredCount };
}

module.exports = { syncSource, syncAllEnabledSources, expireByDeadline };
