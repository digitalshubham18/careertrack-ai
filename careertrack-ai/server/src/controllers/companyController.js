const Company = require('../models/Company');
const JobApplication = require('../models/JobApplication');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Computes live application/interview/offer counts for a company by
 * matching JobApplication.companyName case-insensitively - this is
 * deliberately a live join rather than a duplicated/cached count, so it
 * never drifts out of sync with the application tracker.
 */
async function computeStats(userId, companyName) {
  const applications = await JobApplication.find({
    user: userId,
    companyName: { $regex: `^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  });

  const interviewStatuses = new Set(['Interview', 'Technical Interview', 'HR Interview', 'Final Round']);
  return {
    applications: applications.length,
    interviews: applications.filter((a) => interviewStatuses.has(a.status)).length,
    offers: applications.filter((a) => a.status === 'Offer').length,
  };
}

const createCompany = asyncHandler(async (req, res) => {
  const existing = await Company.findOne({ user: req.user._id, name: req.body.name });
  if (existing) throw ApiError.conflict('You are already tracking this company');

  const company = await Company.create({ ...req.body, user: req.user._id });
  sendSuccess(res, 201, 'Company added', { company, stats: { applications: 0, interviews: 0, offers: 0 } });
});

const listCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ user: req.user._id }).sort({ updatedAt: -1 });
  const withStats = await Promise.all(
    companies.map(async (company) => ({
      company,
      stats: await computeStats(req.user._id, company.name),
    }))
  );
  sendSuccess(res, 200, 'Companies fetched', { companies: withStats });
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!company) throw ApiError.notFound('Company not found');
  const stats = await computeStats(req.user._id, company.name);
  sendSuccess(res, 200, 'Company updated', { company, stats });
});

const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!company) throw ApiError.notFound('Company not found');
  sendSuccess(res, 200, 'Company deleted');
});

module.exports = { createCompany, listCompanies, updateCompany, deleteCompany };
