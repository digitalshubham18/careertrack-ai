const aiService = require('./ai.service');
const { extractSkills } = require('./resumeParser.service');
const logger = require('../utils/logger');

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'you', 'your', 'are', 'will', 'have', 'has',
  'our', 'their', 'from', 'about', 'into', 'onto', 'able', 'a', 'an', 'of', 'to', 'in', 'on',
  'as', 'is', 'be', 'or', 'we', 'us', 'at', 'by', 'it', 'its', 'job', 'role', 'team', 'work',
]);

function tokenizeKeywords(text) {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9+#./\s-]/g, ' ')
        .split(/\s+/)
        .map((word) => word.replace(/^[.\-/]+|[.\-/]+$/g, '')) // trim stray leading/trailing punctuation
        .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    )
  );
}

/**
 * Step 1: Extract structured job requirements from a raw job description
 * using the AI service (with a deterministic fallback so it never fails
 * outright).
 */
async function extractJobRequirements(jobDescription) {
  const deterministicSkills = extractSkills(jobDescription);
  const fallback = {
    requiredSkills: deterministicSkills,
    preferredSkills: [],
    keywords: tokenizeKeywords(jobDescription).slice(0, 40),
    experienceYears: extractExperienceYears(jobDescription),
    educationLevel: extractEducationLevel(jobDescription),
    seniority: extractSeniority(jobDescription),
    responsibilities: [],
    technologies: deterministicSkills,
  };

  if (!aiService.isConfigured()) return fallback;

  const prompt = `Analyze this job description and extract structured requirements.
Do not invent requirements that aren't implied by the text.

JOB DESCRIPTION:
"""${jobDescription.slice(0, 6000)}"""

Return JSON with this exact shape:
{
  "requiredSkills": string[],
  "preferredSkills": string[],
  "keywords": string[],
  "experienceYears": number | null,
  "educationLevel": string | null,
  "seniority": string | null,
  "responsibilities": string[],
  "technologies": string[]
}`;

  try {
    const result = await aiService.completeJSON(prompt, fallback);
    return {
      ...fallback,
      ...result,
      requiredSkills: Array.from(
        new Set([...(result.requiredSkills || []), ...deterministicSkills])
      ),
    };
  } catch (err) {
    logger.error('extractJobRequirements AI call failed, using fallback', { error: err.message });
    return fallback;
  }
}

function extractExperienceYears(text) {
  const match = text.match(/(\d+)\+?\s*(?:to\s*(\d+)\s*)?years?/i);
  if (!match) return null;
  return Number(match[1]);
}

function extractEducationLevel(text) {
  const lower = text.toLowerCase();
  if (lower.includes('phd') || lower.includes('doctorate')) return 'PhD';
  if (lower.includes('master')) return "Master's degree";
  if (lower.includes('bachelor') || lower.includes('b.tech') || lower.includes('b.e.')) {
    return "Bachelor's degree";
  }
  return null;
}

function extractSeniority(text) {
  const lower = text.toLowerCase();
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('staff')) return 'Senior';
  if (lower.includes('junior') || lower.includes('entry') || lower.includes('intern')) return 'Entry-level';
  return 'Mid-level';
}

/**
 * Step 2: Deterministic keyword/skill overlap scoring.
 */
function scoreOverlap(resumeSet, targetList) {
  if (!targetList.length) return { score: 100, matched: [], missing: [] };
  const matched = targetList.filter((item) => resumeSet.has(item.toLowerCase()));
  const missing = targetList.filter((item) => !resumeSet.has(item.toLowerCase()));
  const score = Math.round((matched.length / targetList.length) * 100);
  return { score, matched, missing };
}

function scoreEducation(resumeEducation, requiredLevel) {
  if (!requiredLevel) return 100;
  const rank = { "bachelor's degree": 1, "master's degree": 2, phd: 3 };
  const required = rank[requiredLevel.toLowerCase()] || 1;
  const resumeText = JSON.stringify(resumeEducation).toLowerCase();
  let highest = 0;
  if (resumeText.includes('phd') || resumeText.includes('doctorate')) highest = 3;
  else if (resumeText.includes('master')) highest = 2;
  else if (resumeText.includes('bachelor') || resumeText.includes('b.tech') || resumeText.includes('b.e')) highest = 1;
  if (highest >= required) return 100;
  if (highest === required - 1) return 70;
  return 40;
}

function scoreExperience(resumeExperience, requiredYears) {
  if (!requiredYears) return 100;
  const totalMonths = (resumeExperience || []).reduce((sum, exp) => {
    const durationMatch = (exp.duration || '').match(/(\d+)/g);
    if (!durationMatch) return sum + 6; // assume ~6 months if unparseable
    return sum + Number(durationMatch[0]) * 12; // rough heuristic: number found = years
  }, 0);
  const years = totalMonths / 12;
  if (years >= requiredYears) return 100;
  if (years >= requiredYears * 0.5) return 70;
  return Math.max(30, Math.round((years / requiredYears) * 100));
}

function scoreFormatting(resumeText) {
  // Deterministic heuristic: presence of standard sections, reasonable length,
  // no obvious parsing gibberish, bullet-like structure.
  let score = 100;
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 150) score -= 25; // too short to be a full resume
  if (wordCount > 1200) score -= 10; // likely too long / unfocused
  const hasContactInfo = /@[^\s]+\.[a-z]{2,}/i.test(resumeText);
  if (!hasContactInfo) score -= 15;
  const hasBulletLikeStructure = /(experience|education|skills|projects)/i.test(resumeText);
  if (!hasBulletLikeStructure) score -= 15;
  return Math.max(0, Math.min(100, score));
}

/**
 * Step 3: AI semantic layer - qualitative recommendations only. The AI is
 * never asked to invent a raw ATS number; it only explains/recommends based
 * on the deterministic scores we already computed.
 */
async function generateRecommendations({ resume, jobRequirements, scores, missingSkills, missingKeywords }) {
  const fallback = [
    missingSkills.length
      ? `Add concrete experience with: ${missingSkills.slice(0, 5).join(', ')} if you have it.`
      : 'Your skills align well with this role.',
    'Quantify achievements with measurable results (%, $, time saved, users impacted).',
    missingKeywords.length
      ? `Mirror the job description's language for: ${missingKeywords.slice(0, 5).join(', ')}.`
      : 'Keyword coverage looks strong.',
  ];

  if (!aiService.isConfigured()) return { recommendations: fallback, summary: '' };

  const prompt = `You are an ATS resume coach. Based on the deterministic analysis below, write 4-6 short, specific,
actionable recommendations to improve this resume for this specific job. NEVER invent skills or experience
the candidate doesn't have - only suggest better phrasing, quantification, or reordering of what already
exists, and flag real skill gaps honestly.

RESUME SKILLS: ${JSON.stringify(resume.skills)}
RESUME EXPERIENCE: ${JSON.stringify(resume.experience)}
JOB REQUIRED SKILLS: ${JSON.stringify(jobRequirements.requiredSkills)}
MISSING SKILLS: ${JSON.stringify(missingSkills)}
MISSING KEYWORDS: ${JSON.stringify(missingKeywords)}
CURRENT SCORES: ${JSON.stringify(scores)}

Return JSON: { "recommendations": string[], "summary": string }`;

  try {
    const result = await aiService.completeJSON(prompt, { recommendations: fallback, summary: '' });
    return {
      recommendations: result.recommendations && result.recommendations.length ? result.recommendations : fallback,
      summary: result.summary || '',
    };
  } catch (err) {
    logger.error('generateRecommendations AI call failed, using fallback', { error: err.message });
    return { recommendations: fallback, summary: '' };
  }
}

/**
 * Full ATS analysis pipeline:
 *  1. Extract job requirements (AI + deterministic fallback)
 *  2. Deterministic keyword/skill overlap scoring
 *  3. Deterministic experience/education/formatting scoring
 *  4. Weighted overall score
 *  5. AI-generated qualitative recommendations (never affects the raw score)
 */
async function analyzeResumeAgainstJob({ resume, jobDescription }) {
  const jobRequirements = await extractJobRequirements(jobDescription);

  const resumeSkillSet = new Set((resume.skills || []).map((s) => s.toLowerCase()));
  const resumeKeywordSet = new Set(tokenizeKeywords(resume.extractedText || ''));

  const skillsResult = scoreOverlap(resumeSkillSet, jobRequirements.requiredSkills);
  const keywordsResult = scoreOverlap(resumeKeywordSet, jobRequirements.keywords || []);
  const experienceScore = scoreExperience(resume.experience, jobRequirements.experienceYears);
  const educationScore = scoreEducation(resume.education, jobRequirements.educationLevel);
  const formattingScore = scoreFormatting(resume.extractedText || '');

  // Weighted overall score - weights documented for transparency.
  const weights = {
    keywordMatch: 0.2,
    skillsMatch: 0.35,
    experienceMatch: 0.2,
    educationMatch: 0.1,
    formatting: 0.15,
  };

  const scores = {
    keywordMatch: keywordsResult.score,
    skillsMatch: skillsResult.score,
    experienceMatch: experienceScore,
    educationMatch: educationScore,
    formatting: formattingScore,
  };

  const overall = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => sum + scores[key] * weight, 0)
  );

  const { recommendations, summary } = await generateRecommendations({
    resume,
    jobRequirements,
    scores: { ...scores, overall },
    missingSkills: skillsResult.missing,
    missingKeywords: keywordsResult.missing,
  });

  return {
    scores: { ...scores, overall },
    matchedSkills: skillsResult.matched,
    missingSkills: skillsResult.missing,
    matchedKeywords: keywordsResult.matched.slice(0, 25),
    missingKeywords: keywordsResult.missing.slice(0, 25),
    jobRequirements: {
      requiredSkills: jobRequirements.requiredSkills,
      preferredSkills: jobRequirements.preferredSkills || [],
      experienceYears: jobRequirements.experienceYears,
      educationLevel: jobRequirements.educationLevel,
      seniority: jobRequirements.seniority,
    },
    recommendations,
    aiSummary: summary,
  };
}

module.exports = {
  analyzeResumeAgainstJob,
  extractJobRequirements,
  tokenizeKeywords,
  scoreFormatting,
  scoreOverlap,
  scoreEducation,
  scoreExperience,
  extractExperienceYears,
  extractEducationLevel,
};
