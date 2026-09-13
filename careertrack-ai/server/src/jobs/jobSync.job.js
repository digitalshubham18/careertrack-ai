const { syncAllEnabledSources } = require('../services/jobs/jobAggregator.service');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Periodically syncs every enabled JobSource. Interval is configurable via
 * JOB_SYNC_INTERVAL_MINUTES (default 60). Kept dependency-free (no
 * node-cron/BullMQ) to match the existing reminders.job.js pattern; each
 * individual source additionally guards against overlapping runs of
 * itself via JobSource.isSyncing (see jobAggregator.service.js).
 */
function startJobSync(io) {
  const intervalMs = env.jobSyncIntervalMinutes * 60 * 1000;

  const runSync = () => {
    syncAllEnabledSources({ triggeredBy: 'scheduled', io })
      .then(({ results, expiredCount }) => {
        const totals = results.reduce(
          (acc, { result }) => {
            if (!result) return acc;
            acc.created += result.created;
            acc.updated += result.updated;
            return acc;
          },
          { created: 0, updated: 0 }
        );
        logger.info('Scheduled job sync completed', { ...totals, expiredCount, sources: results.length });
      })
      .catch((err) => logger.error('Scheduled job sync failed', { error: err.message }));
  };

  runSync();
  setInterval(runSync, intervalMs);
  logger.info(`Job sync scheduled every ${env.jobSyncIntervalMinutes} minutes`);
}

module.exports = { startJobSync };
