const aiService = require('./ai.service');
const logger = require('../utils/logger');

/**
 * Every function here returns a SUGGESTION the user can accept or ignore -
 * nothing is saved automatically, and nothing is ever invented that isn't
 * grounded in what the user already wrote. Deterministic fallbacks are
 * real, usable text (not placeholders) for when AI isn't configured.
 */

async function generateSummary({ skills = [], experience = [], targetRole = '' }) {
  const topSkills = skills.slice(0, 5).join(', ');
  const latestRole = experience[0];
  const fallback = latestRole
    ? `${latestRole.title || 'Professional'} with experience at ${latestRole.company || 'a growing company'}, skilled in ${topSkills || 'a range of technical tools'}. Seeking to bring these skills to a ${targetRole || 'new'} role.`
    : `Motivated professional skilled in ${topSkills || 'relevant technical tools'}, seeking a ${targetRole || 'new'} opportunity.`;

  if (!aiService.isConfigured()) return fallback;

  const prompt = `Write a concise, 2-3 sentence professional resume summary using ONLY this real information -
never invent skills or experience not listed here.

SKILLS: ${JSON.stringify(skills)}
EXPERIENCE: ${JSON.stringify(experience)}
TARGET ROLE: ${targetRole || 'not specified'}

Return ONLY the summary text, no preamble.`;

  try {
    const text = await aiService.complete(prompt, { maxTokens: 200 });
    return text?.trim().length > 10 ? text.trim() : fallback;
  } catch (err) {
    logger.error('generateSummary AI call failed, using fallback', { error: err.message });
    return fallback;
  }
}

async function improveBullet({ text, context = '' }) {
  const fallback = `${text} — consider adding a measurable result (e.g. a percentage, dollar amount, time saved, or user count) to strengthen this bullet.`;
  if (!aiService.isConfigured()) return fallback;

  const prompt = `Improve this resume bullet point to be more specific and impact-focused. Do NOT invent
metrics, technologies, or outcomes that aren't implied by the original text - if there's no measurable result
mentioned, suggest the phrasing improvement without fabricating a number.

ORIGINAL BULLET: "${text}"
CONTEXT (role/project): ${context}

Return ONLY the improved bullet text, no preamble.`;

  try {
    const result = await aiService.complete(prompt, { maxTokens: 150 });
    return result?.trim().length > 5 ? result.trim() : fallback;
  } catch (err) {
    logger.error('improveBullet AI call failed, using fallback', { error: err.message });
    return fallback;
  }
}

async function optimizeKeywords({ resumeText, jobDescription }) {
  const fallback = 'Configure an AI key to get keyword optimization suggestions tailored to this job description.';
  if (!aiService.isConfigured()) return fallback;

  const prompt = `Compare this resume text against the job description and suggest which EXISTING resume content
should be rephrased to better match the job's keywords. Do NOT suggest adding skills/experience not already
present in the resume - only rephrasing/reordering suggestions.

RESUME: """${resumeText.slice(0, 3000)}"""
JOB DESCRIPTION: """${jobDescription.slice(0, 2000)}"""

Return 3-5 short, specific suggestions as plain text bullet points.`;

  try {
    const result = await aiService.complete(prompt, { maxTokens: 400 });
    return result?.trim().length > 10 ? result.trim() : fallback;
  } catch (err) {
    logger.error('optimizeKeywords AI call failed, using fallback', { error: err.message });
    return fallback;
  }
}

module.exports = { generateSummary, improveBullet, optimizeKeywords };
