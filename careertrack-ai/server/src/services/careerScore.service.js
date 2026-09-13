const Resume = require('../models/Resume');
const ATSAnalysis = require('../models/ATSAnalysis');
const JobMatch = require('../models/JobMatch');
const JobApplication = require('../models/JobApplication');
const Interview = require('../models/Interview');
const DsaEntry = require('../models/DsaEntry');
const dsaService = require('./dsa.service');

/**
 * CareerTrack Score combines six categories, each computed from data that
 * genuinely exists elsewhere in the platform (never fabricated):
 *
 *   Resume        - latest ATS analysis score for the primary resume, or a
 *                   completeness heuristic if no analysis exists yet
 *   DSA           - weighted problem count (harder problems count more)
 *                   against a reasonable target, informed by streak
 *   Skills        - average "skills match" score from real JobMatch history
 *                   against jobs the user has actually been matched to,
 *                   falling back to a skill-count heuristic with no history
 *   Projects      - number and quality (has a description) of resume projects
 *   Applications  - job-search activity level over the last 30 days
 *   Interviews    - average mock interview score, falling back to the
 *                   interview conversion rate from the application funnel
 *
 * Weighted into one overall score. Every category is independently
 * explainable and traceable back to real records - nothing here is an AI
 * guess or a fabricated number.
 */

const WEIGHTS = {
  resume: 0.2,
  dsa: 0.15,
  skills: 0.2,
  projects: 0.15,
  applications: 0.15,
  interviews: 0.15,
};

// A rough, generous target for an active job search - not a hard requirement.
const DSA_WEIGHTED_TARGET = 120; // e.g. 60 easy + 30 medium + 15 hard ≈ 120 weighted points
const APPLICATIONS_MONTHLY_TARGET = 12;

async function getResumeScore(userId, primaryResumeId) {
  if (!primaryResumeId) return { score: 0, basis: 'no_resume' };

  const latestAnalysis = await ATSAnalysis.findOne({ user: userId, resume: primaryResumeId }).sort({ createdAt: -1 });
  if (latestAnalysis) {
    return { score: latestAnalysis.scores.overall, basis: 'latest_ats_analysis' };
  }

  const resume = await Resume.findById(primaryResumeId);
  if (!resume) return { score: 0, basis: 'no_resume' };

  // No ATS analysis yet - fall back to a completeness heuristic so a new
  // resume with real content still shows something better than zero.
  let score = 0;
  if (resume.summary) score += 15;
  if ((resume.skills || []).length >= 5) score += 25;
  else score += (resume.skills || []).length * 5;
  if ((resume.experience || []).length >= 1) score += 25;
  if ((resume.education || []).length >= 1) score += 15;
  if ((resume.projects || []).length >= 1) score += 20;

  return { score: Math.min(100, score), basis: 'completeness_heuristic' };
}

async function getDsaScore(userId, dailyGoal) {
  const summary = await dsaService.getSummary(userId, dailyGoal);
  const weighted = (summary.byDifficulty.Easy || 0) * 1 + (summary.byDifficulty.Medium || 0) * 1.5 + (summary.byDifficulty.Hard || 0) * 2;
  const baseScore = Math.min(100, Math.round((weighted / DSA_WEIGHTED_TARGET) * 100));
  const streakBonus = Math.min(10, summary.streak); // small bonus for consistency, capped
  return { score: Math.min(100, baseScore + streakBonus), basis: 'weighted_solved_count', summary };
}

async function getSkillsScore(userId, primaryResumeId) {
  const matches = await JobMatch.find({ user: userId }).sort({ createdAt: -1 }).limit(20);
  if (matches.length > 0) {
    const avg = matches.reduce((sum, m) => sum + m.scores.skills, 0) / matches.length;
    return { score: Math.round(avg), basis: 'avg_job_match_skills' };
  }

  if (!primaryResumeId) return { score: 0, basis: 'no_data' };
  const resume = await Resume.findById(primaryResumeId);
  const skillCount = resume?.skills?.length || 0;
  return { score: Math.min(100, skillCount * 10), basis: 'skill_count_heuristic' };
}

async function getProjectsScore(primaryResumeId) {
  if (!primaryResumeId) return { score: 0, basis: 'no_resume' };
  const resume = await Resume.findById(primaryResumeId);
  const projects = resume?.projects || [];
  if (projects.length === 0) return { score: 0, basis: 'no_projects' };

  const withDescription = projects.filter((p) => p.description && p.description.length > 20).length;
  const score = Math.min(100, withDescription * 30 + (projects.length - withDescription) * 10);
  return { score, basis: 'project_count_and_quality' };
}

async function getApplicationsScore(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const count = await JobApplication.countDocuments({ user: userId, createdAt: { $gte: thirtyDaysAgo } });
  const score = Math.min(100, Math.round((count / APPLICATIONS_MONTHLY_TARGET) * 100));
  return { score, basis: 'applications_last_30_days', count };
}

async function getInterviewScore(userId) {
  const interviews = await Interview.find({ user: userId, averageScore: { $ne: null } });
  if (interviews.length > 0) {
    const avg = interviews.reduce((sum, i) => sum + i.averageScore, 0) / interviews.length;
    return { score: Math.round(avg * 10), basis: 'avg_mock_interview_score' };
  }

  const applications = await JobApplication.find({ user: userId });
  const applied = applications.filter((a) => a.status !== 'Saved').length;
  if (applied === 0) return { score: 0, basis: 'no_data' };

  const interviewStatuses = new Set(['Interview', 'Technical Interview', 'HR Interview', 'Final Round', 'Offer']);
  const interviewed = applications.filter((a) => interviewStatuses.has(a.status)).length;
  const score = Math.min(100, Math.round((interviewed / applied) * 100));
  return { score, basis: 'interview_conversion_rate' };
}

function buildRecommendations({ resume, dsa, skills, projects, applications, interviews }) {
  const recommendations = [];
  const categories = [
    { key: 'resume', score: resume.score, message: '📄 Improve your resume — add measurable achievements and run an ATS analysis.' },
    { key: 'dsa', score: dsa.score, message: `🎯 Practice more DSA problems${dsa.summary?.weakTopics?.[0] ? ` — try ${dsa.summary.weakTopics[0]} today` : ''}.` },
    { key: 'skills', score: skills.score, message: '💡 Broaden your skill set to match more of the roles you\'re targeting.' },
    { key: 'projects', score: projects.score, message: '🛠️ Add a project with a detailed description to your resume.' },
    { key: 'applications', score: applications.score, message: '💼 Increase your weekly application volume to improve your odds.' },
    { key: 'interviews', score: interviews.score, message: '🎤 Run a mock interview to sharpen your interview readiness.' },
  ];

  categories
    .filter((c) => c.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .forEach((c) => recommendations.push(c.message));

  if (recommendations.length === 0) {
    recommendations.push('🎉 Great work across the board — keep up the momentum!');
  }

  return recommendations;
}

async function getCareerScore(user) {
  const primaryResumeId = user.primaryResume;

  const [resume, dsa, skills, projects, applications, interviews] = await Promise.all([
    getResumeScore(user._id, primaryResumeId),
    getDsaScore(user._id, user.dsaDailyGoal),
    getSkillsScore(user._id, primaryResumeId),
    getProjectsScore(primaryResumeId),
    getApplicationsScore(user._id),
    getInterviewScore(user._id),
  ]);

  const categoryScores = { resume: resume.score, dsa: dsa.score, skills: skills.score, projects: projects.score, applications: applications.score, interviews: interviews.score };

  const overall = Math.round(
    Object.entries(WEIGHTS).reduce((sum, [key, weight]) => sum + categoryScores[key] * weight, 0)
  );

  return {
    overall,
    categories: categoryScores,
    weights: WEIGHTS,
    recommendations: buildRecommendations({ resume, dsa, skills, projects, applications, interviews }),
  };
}

module.exports = { getCareerScore, buildRecommendations };
