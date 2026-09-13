const aiService = require('./ai.service');
const logger = require('../utils/logger');

/**
 * Builds a genuinely usable deterministic document from the candidate's
 * actual resume/application data when AI isn't configured or fails - never
 * a "Lorem ipsum" placeholder. Each template only uses information that is
 * actually present (skills, experience, job title/company), never invents
 * experience the candidate doesn't have.
 */
function buildFallback(type, { user, resume, application }) {
  const topSkills = (resume?.skills || []).slice(0, 5).join(', ') || 'relevant technical skills';
  const latestRole = resume?.experience?.[0];
  const experienceLine = latestRole
    ? `In my current role as ${latestRole.title || 'a professional'} at ${latestRole.company || 'my current company'}, I have developed strong experience with ${topSkills}.`
    : `I have hands-on experience with ${topSkills}.`;

  const templates = {
    cover_letter: `Dear Hiring Manager,

I am writing to express my interest in the ${application.jobTitle} position at ${application.companyName}. ${experienceLine}

I am particularly drawn to this opportunity because it aligns closely with my background and career goals. I would welcome the chance to discuss how my skills in ${topSkills} can contribute to your team.

Thank you for considering my application. I look forward to the opportunity to speak further.

Sincerely,
${user.name}`,

    recruiter_message: `Hi, I recently applied for the ${application.jobTitle} role at ${application.companyName} and wanted to reach out directly. ${experienceLine} I'd love to learn more about the role and share how my background could be a good fit. Would you be open to a quick chat?

Best,
${user.name}`,

    linkedin_message: `Hi, I saw the ${application.jobTitle} opening at ${application.companyName} and just submitted my application. I have experience with ${topSkills} and I'm genuinely excited about this opportunity. I'd appreciate the chance to connect and learn more about the team.

Thanks,
${user.name}`,

    follow_up: `Hi, I wanted to follow up on my application for the ${application.jobTitle} position at ${application.companyName}, submitted on ${new Date(application.applicationDate).toLocaleDateString()}. I remain very interested in the role and would appreciate any update on the status of my application.

Thank you for your time.

Best regards,
${user.name}`,

    thank_you: `Dear Hiring Team,

Thank you for taking the time to speak with me about the ${application.jobTitle} position at ${application.companyName}. I enjoyed learning more about the role and the team, and I'm even more enthusiastic about the opportunity after our conversation.

Please let me know if there is any additional information I can provide.

Best regards,
${user.name}`,
  };

  return templates[type];
}

const TYPE_PROMPTS = {
  cover_letter: 'Write a concise, specific, professional cover letter (3-4 short paragraphs)',
  recruiter_message: 'Write a short, friendly outreach message (3-5 sentences) to send directly to a recruiter',
  linkedin_message: 'Write a short LinkedIn connection/outreach message (2-4 sentences, casual-professional tone)',
  follow_up: 'Write a brief, polite follow-up message checking on application status (3-4 sentences)',
  thank_you: 'Write a short post-interview thank-you note (3-4 sentences)',
};

/**
 * Generates one of: cover_letter, recruiter_message, linkedin_message,
 * follow_up, thank_you - grounded in the candidate's ACTUAL resume and the
 * specific job application, never inventing skills/experience they don't
 * have. Falls back to a real, usable template (not a placeholder) if AI is
 * unavailable.
 */
async function generateApplicationDocument(type, { user, resume, application }) {
  const fallback = buildFallback(type, { user, resume, application });
  if (!TYPE_PROMPTS[type]) throw new Error(`Unknown document type: ${type}`);

  if (!aiService.isConfigured()) return fallback;

  const prompt = `${TYPE_PROMPTS[type]} for this specific job application. Use ONLY real information from the
candidate's resume below - never invent skills, employers, or experience they don't have. Be specific to the
role and company, not generic.

CANDIDATE NAME: ${user.name}
CANDIDATE SKILLS: ${JSON.stringify(resume?.skills || [])}
CANDIDATE EXPERIENCE: ${JSON.stringify(resume?.experience || [])}
CANDIDATE EDUCATION: ${JSON.stringify(resume?.education || [])}

JOB TITLE: ${application.jobTitle}
COMPANY: ${application.companyName}
JOB DESCRIPTION: """${(application.jobDescription || '').slice(0, 2000)}"""

Return ONLY the message text - no preamble, no explanation, no markdown formatting, no subject line unless
the format calls for one.`;

  try {
    const text = await aiService.complete(prompt, { maxTokens: 700 });
    return text && text.trim().length > 20 ? text.trim() : fallback;
  } catch (err) {
    logger.error('generateApplicationDocument AI call failed, using fallback template', { error: err.message, type });
    return fallback;
  }
}

module.exports = { generateApplicationDocument, TYPE_PROMPTS };
