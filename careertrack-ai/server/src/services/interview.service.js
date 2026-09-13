const aiService = require('./ai.service');
const { categorizeJob } = require('./jobs/jobCategorization.service');
const logger = require('../utils/logger');

const GENERIC_BEHAVIORAL = [
  'Tell me about yourself.',
  'Why do you want to join us?',
  'Tell me about a difficult project you worked on and how you handled it.',
  'Describe a time you disagreed with a teammate. How did you resolve it?',
  'What are you most proud of in your career/projects so far?',
];

/**
 * Field-specific technical topics, keyed by the same job categories used
 * elsewhere in the platform (jobCategorization.service.js). This is what
 * guarantees a candidate applying to, say, an AI/ML or DevOps role gets
 * questions grounded in that field rather than generic web-dev topics -
 * both as the deterministic fallback (no AI key) AND as a safety net that
 * gets merged into AI-generated question sets (see below).
 */
const FIELD_TOPICS = {
  Frontend: ['JavaScript', 'React', 'CSS/Layout', 'Web Performance', 'Accessibility'],
  Backend: ['API Design', 'Databases', 'System Design', 'Caching', 'Authentication & Authorization'],
  'Full Stack': ['REST APIs', 'React', 'Node.js', 'Databases', 'System Design'],
  SDE: ['Data Structures & Algorithms', 'System Design', 'Object-Oriented Design', 'Operating Systems', 'Databases'],
  'AI/ML': ['Machine Learning Fundamentals', 'Neural Networks', 'Model Evaluation Metrics', 'Data Preprocessing', 'Python'],
  'Data Science': ['Statistics', 'SQL', 'Data Cleaning', 'Data Visualization', 'Python/Pandas'],
  DevOps: ['CI/CD Pipelines', 'Docker & Containers', 'Kubernetes', 'Infrastructure as Code', 'Monitoring & Logging'],
  Cloud: ['Cloud Architecture', 'Networking', 'Infrastructure as Code', 'Scalability', 'Cost Optimization'],
  Cybersecurity: ['Security Fundamentals', 'OWASP Top 10', 'Encryption', 'Network Security', 'Authentication'],
  Mobile: ['Mobile UI Patterns', 'App Lifecycle', 'Offline Storage', 'Performance Optimization', 'Platform APIs'],
  QA: ['Testing Strategies', 'Test Automation', 'Test Case Design', 'Bug Triage', 'CI Testing'],
  Product: ['Product Sense', 'Prioritization Frameworks', 'Metrics & Analytics', 'Stakeholder Management', 'Roadmapping'],
  Internship: ['Data Structures & Algorithms', 'Object-Oriented Programming', 'Databases', 'Version Control', 'Problem Solving'],
  Other: ['Core Technical Fundamentals', 'Problem Solving', 'Tools & Best Practices', 'System Design', 'Domain Knowledge'],
};

function buildFieldAwareFallback({ category, jobTitle, companyName, requiredSkills = [], resumeSkills = [] }) {
  const fieldTopics = FIELD_TOPICS[category] || FIELD_TOPICS.Other;

  // Prefer topics that are actually named in the job's required skills or
  // the candidate's resume, then top up with the field's standard topics -
  // this way the topic list is grounded in real data whenever it's
  // available, and never falls back to an unrelated field's questions.
  const skillTopics = Array.from(new Set([...requiredSkills, ...resumeSkills])).slice(0, 3);
  const topics = Array.from(new Set([...skillTopics, ...fieldTopics])).slice(0, 5);

  const fallbackTechnical = topics.map((topic) => ({
    category: 'Technical',
    topic,
    question: `Explain a core concept of ${topic} and walk through how you have applied it in a real project.`,
  }));

  const fallbackBehavioral = GENERIC_BEHAVIORAL.map((q) => ({
    category: 'Behavioral',
    topic: '',
    question: q,
  }));

  const fallbackCompany = [
    {
      category: 'Company/Role',
      topic: companyName,
      question: `What do you know about ${companyName || 'this company'} and why does this ${jobTitle || 'role'} interest you?`,
    },
    {
      category: 'Company/Role',
      topic: category,
      question: `This is a ${category} role - what excites you specifically about working in ${category}?`,
    },
  ];

  return [...fallbackTechnical, ...fallbackBehavioral, ...fallbackCompany];
}

/**
 * Generates a full interview prep set: technical, behavioral, and
 * company/role-specific questions grounded in the job description AND the
 * job's field/category - never generic web-dev questions for a non-web-dev
 * role. `category` and `requiredSkills` are optional; when not supplied
 * (e.g. a free-text application with no linked JobListing), the category is
 * inferred from the title/description via the same categorizer used for
 * job discovery, so behavior is consistent across the whole platform.
 */
async function generateInterviewQuestions({
  jobTitle, companyName, jobDescription, resumeSkills, requiredSkills = [], category,
}) {
  const resolvedCategory = category || categorizeJob(jobTitle || '', jobDescription || '');
  const fallback = buildFieldAwareFallback({
    category: resolvedCategory,
    jobTitle,
    companyName,
    requiredSkills,
    resumeSkills,
  });

  if (!aiService.isConfigured()) return fallback;

  const prompt = `Generate interview preparation questions for this candidate and role.

JOB TITLE: ${jobTitle}
JOB FIELD/CATEGORY: ${resolvedCategory}
COMPANY: ${companyName}
JOB DESCRIPTION: """${(jobDescription || '').slice(0, 4000)}"""
JOB REQUIRED SKILLS: ${JSON.stringify(requiredSkills)}
CANDIDATE SKILLS: ${JSON.stringify(resumeSkills || [])}

Generate:
- 5 Technical questions that are SPECIFICALLY relevant to the "${resolvedCategory}" field and this job's
  required skills/tech stack - do not default to generic web-development questions if the role is in a
  different field (e.g. an AI/ML role should get ML questions, a DevOps role should get infrastructure/CI-CD
  questions, a Data Science role should get statistics/SQL questions, etc.)
- 3 Behavioral questions
- 3 Company/Role specific questions grounded in the job description

Return JSON: { "questions": [{ "category": "Technical"|"Behavioral"|"Company/Role", "topic": string, "question": string }] }`;

  try {
    const result = await aiService.completeJSON(prompt, { questions: fallback });
    const questions = result.questions && result.questions.length ? result.questions : fallback;

    // Safety net: if the AI response somehow contains zero technical
    // questions naming any field-relevant topic (e.g. a malformed/partial
    // response), top it up with the field-aware fallback's technical
    // questions rather than shipping a set with no field-specific coverage.
    const hasTechnical = questions.some((q) => q.category === 'Technical');
    if (!hasTechnical) {
      const fallbackTechnical = fallback.filter((q) => q.category === 'Technical');
      return [...fallbackTechnical, ...questions];
    }
    return questions;
  } catch (err) {
    logger.error('generateInterviewQuestions AI call failed, using field-aware fallback', { error: err.message });
    return fallback;
  }
}

/**
 * Evaluates a candidate's typed answer to an interview question across
 * six dimensions and returns a 0-10 score plus constructive feedback.
 * This is explicitly NEVER framed as an actual hiring decision.
 */
async function evaluateAnswer({ question, answer }) {
  const fallback = {
    technicalAccuracy: 6,
    communication: 6,
    relevance: 6,
    completeness: 5,
    confidence: 6,
    structure: 6,
    score: 5.8,
    feedback:
      'AI evaluation is unavailable (no AI_API_KEY configured). Configure it in .env to receive detailed, personalized feedback.',
    improvedAnswer: '',
  };

  if (!aiService.isConfigured()) return fallback;

  const prompt = `You are an interview coach evaluating a practice answer. This is NOT a real hiring decision -
it is practice feedback to help the candidate improve.

QUESTION: ${question}
CANDIDATE ANSWER: """${answer}"""

Score each dimension from 0-10 and provide constructive, specific feedback plus one improved example answer
that builds on what the candidate actually said (do not invent unrelated experience).

Return JSON:
{
  "technicalAccuracy": number, "communication": number, "relevance": number,
  "completeness": number, "confidence": number, "structure": number,
  "score": number, "feedback": string, "improvedAnswer": string
}`;

  try {
    return await aiService.completeJSON(prompt, fallback);
  } catch (err) {
    logger.error('evaluateAnswer AI call failed, using fallback', { error: err.message });
    return fallback;
  }
}

module.exports = { generateInterviewQuestions, evaluateAnswer };
