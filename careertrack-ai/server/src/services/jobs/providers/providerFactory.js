const RemotiveProvider = require('./remotiveProvider');
const GreenhouseProvider = require('./greenhouseProvider');
const RssFeedProvider = require('./rssProvider');

/**
 * Maps a JobSource.type to its concrete provider class. Adding a new
 * external source type means: write a new Provider subclass, register it
 * here, and add the type to the JobSource/JobListing enums - nothing else
 * in the aggregation pipeline needs to change.
 */
const PROVIDER_REGISTRY = {
  remotive: RemotiveProvider,
  greenhouse: GreenhouseProvider,
  rss: RssFeedProvider,
};

function createProvider(jobSource) {
  const ProviderClass = PROVIDER_REGISTRY[jobSource.type];
  if (!ProviderClass) {
    throw new Error(`No provider registered for job source type "${jobSource.type}"`);
  }
  return new ProviderClass(jobSource.config || {});
}

module.exports = { createProvider, PROVIDER_REGISTRY };
