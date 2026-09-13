const JobSource = require('../models/JobSource');
const JobSyncLog = require('../models/JobSyncLog');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { syncSource, syncAllEnabledSources } = require('../services/jobs/jobAggregator.service');
const { PROVIDER_REGISTRY } = require('../services/jobs/providers/providerFactory');

const listSources = asyncHandler(async (req, res) => {
  const sources = await JobSource.find().sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Job sources fetched', { sources, availableTypes: Object.keys(PROVIDER_REGISTRY) });
});

const createSource = asyncHandler(async (req, res) => {
  const { name, type, config, enabled } = req.body;
  if (!PROVIDER_REGISTRY[type]) throw ApiError.badRequest(`Unknown provider type "${type}"`);

  const source = await JobSource.create({ name, type, config, enabled: enabled ?? true });
  sendSuccess(res, 201, 'Job source created', { source });
});

const updateSource = asyncHandler(async (req, res) => {
  const { name, config, enabled } = req.body;
  const source = await JobSource.findById(req.params.id);
  if (!source) throw ApiError.notFound('Job source not found');

  if (name !== undefined) source.name = name;
  if (config !== undefined) source.config = config;
  if (enabled !== undefined) source.enabled = enabled;
  await source.save();

  sendSuccess(res, 200, 'Job source updated', { source });
});

const deleteSource = asyncHandler(async (req, res) => {
  const source = await JobSource.findByIdAndDelete(req.params.id);
  if (!source) throw ApiError.notFound('Job source not found');
  sendSuccess(res, 200, 'Job source deleted');
});

/** Manual "Sync now" for a single source (spec #9). Runs synchronously and
 * returns the result - large syncs still won't block other requests since
 * this is a single HTTP request/response cycle, not a UI-blocking action. */
const syncOne = asyncHandler(async (req, res) => {
  const source = await JobSource.findById(req.params.id);
  if (!source) throw ApiError.notFound('Job source not found');
  if (source.isSyncing) throw ApiError.badRequest('This source is already syncing');

  const result = await syncSource(source, { triggeredBy: 'manual', io: req.io });
  sendSuccess(res, 200, 'Sync completed', { result });
});

const syncAll = asyncHandler(async (req, res) => {
  const { results, expiredCount } = await syncAllEnabledSources({ triggeredBy: 'manual', io: req.io });
  sendSuccess(res, 200, 'Sync completed for all enabled sources', { results, expiredCount });
});

const listSyncLogs = asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;
  const logs = await JobSyncLog.find().sort({ createdAt: -1 }).limit(Math.min(100, Number(limit)));
  sendSuccess(res, 200, 'Sync logs fetched', { logs });
});

module.exports = { listSources, createSource, updateSource, deleteSource, syncOne, syncAll, listSyncLogs };
