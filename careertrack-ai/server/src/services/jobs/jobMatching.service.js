const User = require('../../models/User');
const Resume = require('../../models/Resume');
const JobMatch = require('../../models/JobMatch');
const { createNotification } = require('../notification.service');
const {
  scoreOverlap, scoreEducation, scoreExperience, extractEducationLevel, extractExperienceYears,
} = require('../ats.service');
const logger = require('../../utils/logger');

const HIGH_MATCH_THRESHOLD = 85;

/**
 * Deterministic match between one resume and one job listing. Deliberately
 * mirrors the transparency principle of the ATS analyzer: every category is
 * independently explainable, nothing depends on an AI call succeeding.
 */
function computeMatch({ resume, user, job }) {
  const resumeSkillSet = new Set((resume.skills || []).map((s) => s.toLowerCase()));
  const skillsResult = scoreOverlap(resumeSkillSet, job.requiredSkills || []);

  const experienceYears = job.experienceYears ?? extractExperienceYears(job.description || '');
  const experienceScore = scoreExperience(resume.experience, experienceYears);

  const requiredEducation = extractEducationLevel(job.description || '');
  const educationScore = scoreEducation(resume.education, requiredEducation);

  let locationScore = 100;
  if (job.workMode !== 'Remote') {
    const preferredLocations = (user.preferredLocations || []).map((l) => l.toLowerCase());
    const jobLocation = (job.location || '').toLowerCase();
    if (preferredLocations.length === 0) {
      locationScore = 70; // no stated preference - neutral, not penalized
    } else {
      const hasMatch = preferredLocations.some(
        (loc) => jobLocation.includes(loc) || loc.includes(jobLocation)
      );
      locationScore = hasMatch ? 100 : 40;
    }
  }

  const weights = { skills: 0.45, experience: 0.25, location: 0.15, education: 0.15 };
  const scores = {
    skills: skillsResult.score,
    experience: experienceScore,
    location: locationScore,
    education: educationScore,
  };
  const overallScore = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => sum + scores[key] * weight, 0)
  );

  const recommendations = [];
  if (skillsResult.missing.length) {
    recommendations.push(`Consider building experience with: ${skillsResult.missing.slice(0, 4).join(', ')}.`);
  }
  if (locationScore < 100 && job.workMode !== 'Remote') {
    recommendations.push(`This role is on-site/hybrid in ${job.location}, outside your stated preferred locations.`);
  }
  if (experienceScore < 70) {
    recommendations.push('Your tracked experience is below what this role typically expects.');
  }
  if (!recommendations.length) {
    recommendations.push('Strong overall fit based on your resume and preferences.');
  }

  return {
    overallScore,
    scores,
    matchedSkills: skillsResult.matched,
    missingSkills: skillsResult.missing,
    recommendations,
  };
}

/** Computes (and caches) the match between a specific user/resume and job listing. */
async function getOrComputeMatch({ userId, resumeId, job }) {
  const [user, resume] = await Promise.all([User.findById(userId), Resume.findById(resumeId)]);
  if (!user || !resume) throw new Error('User or resume not found for matching');

  const result = computeMatch({ resume, user, job });

  const match = await JobMatch.findOneAndUpdate(
    { user: userId, jobListing: job._id },
    { resume: resumeId, ...result },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return match;
}

/**
 * Called after a sync creates new listings: finds users with a parsed
 * primary resume, computes their match against each new listing, and
 * notifies ONLY strong matches (>= HIGH_MATCH_THRESHOLD) who have opted in.
 * Deliberately does not notify every user about every new job - see
 * jobAggregator.service.js comments on avoiding notification spam. Users
 * still discover all new jobs organically via the "New Jobs" feed.
 */
async function matchNewListingToUsers(newListings, io) {
  if (!newListings.length) return;

  const usersWithResume = await User.find({
    primaryResume: { $ne: null },
    isActive: true,
    'notificationPreferences.highMatchJobs': true,
  }).select('_id primaryResume preferredLocations');

  if (!usersWithResume.length) return;

  for (const job of newListings) {
    for (const user of usersWithResume) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const resume = await Resume.findById(user.primaryResume);
        if (!resume || resume.parseStatus !== 'parsed') continue;

        // eslint-disable-next-line no-await-in-loop
        const match = await getOrComputeMatch({ userId: user._id, resumeId: resume._id, job });

        if (match.overallScore >= HIGH_MATCH_THRESHOLD) {
          // eslint-disable-next-line no-await-in-loop
          await createNotification(io, {
            userId: user._id,
            type: 'high_match_job',
            title: `${match.overallScore}% job match`,
            message: `${job.title} at ${job.companyName} strongly matches your profile.`,
            relatedJobListing: job._id,
          });
        }
      } catch (err) {
        logger.error('Failed to compute/notify job match', { userId: user._id.toString(), error: err.message });
      }
    }
  }
}

module.exports = { computeMatch, getOrComputeMatch, matchNewListingToUsers, HIGH_MATCH_THRESHOLD };
