const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const aiService = require('./ai.service');
const logger = require('../utils/logger');

// A reasonably broad, curated skills dictionary used for deterministic
// keyword extraction. Kept simple/readable on purpose - can be extended.
const SKILLS_DICTIONARY = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby',
  'react', 'react.js', 'redux', 'vue', 'angular', 'next.js', 'svelte', 'tailwind', 'tailwind css',
  'html', 'css', 'sass', 'bootstrap',
  'node.js', 'express', 'express.js', 'nestjs', 'django', 'flask', 'spring boot', 'fastapi',
  'mongodb', 'mongoose', 'postgresql', 'mysql', 'sqlite', 'redis', 'firebase', 'dynamodb',
  'graphql', 'rest api', 'rest apis', 'grpc', 'websocket', 'socket.io',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'github actions', 'terraform',
  'git', 'github', 'gitlab', 'linux', 'bash', 'nginx',
  'jest', 'mocha', 'cypress', 'selenium', 'testing library',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
  'agile', 'scrum', 'microservices', 'system design', 'data structures', 'algorithms', 'oop',
];

function extractSkills(text) {
  const lower = text.toLowerCase();
  return SKILLS_DICTIONARY.filter((skill) => lower.includes(skill)).map(titleCaseSkill);
}

function titleCaseSkill(skill) {
  const knownCasing = {
    'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'java': 'Java',
    'c++': 'C++', 'c#': 'C#', 'react': 'React', 'react.js': 'React.js', 'node.js': 'Node.js',
    'mongodb': 'MongoDB', 'mongoose': 'Mongoose', 'aws': 'AWS', 'gcp': 'GCP', 'azure': 'Azure',
    'ci/cd': 'CI/CD', 'rest api': 'REST API', 'rest apis': 'REST APIs', 'graphql': 'GraphQL',
    'docker': 'Docker', 'kubernetes': 'Kubernetes', 'git': 'Git', 'github': 'GitHub',
    'html': 'HTML', 'css': 'CSS', 'sass': 'SASS', 'sql': 'SQL', 'mysql': 'MySQL',
    'postgresql': 'PostgreSQL', 'oop': 'OOP', 'socket.io': 'Socket.IO',
  };
  return knownCasing[skill] || skill.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractEmails(text) {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
}

/**
 * Very lightweight section splitter used as a deterministic fallback/aid
 * before handing text to the AI for structured extraction.
 */
function splitSections(text) {
  const sectionHeaders = ['experience', 'education', 'projects', 'certifications', 'skills'];
  const lines = text.split(/\n+/);
  const sections = {};
  let current = 'summary';
  sections[current] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const lower = line.toLowerCase();
    const matchedHeader = sectionHeaders.find((h) => lower === h || lower.startsWith(h));
    if (matchedHeader && line.length < 40) {
      current = matchedHeader;
      sections[current] = sections[current] || [];
      continue;
    }
    if (line) sections[current].push(line);
  }
  return sections;
}

async function extractTextFromBuffer(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error('Unsupported file type for text extraction');
}

/**
 * Uses the AI service to turn raw resume text into structured JSON.
 * Deterministic regex-based extraction is used as the safety-net fallback
 * so the feature still works if AI is unavailable/misconfigured.
 */
async function extractStructuredData(text) {
  const deterministicSkills = extractSkills(text);
  const sections = splitSections(text);

  const prompt = `You are a resume parsing engine. Extract structured data from the resume text below.
Only extract information that is actually present in the text - never invent or embellish anything.

RESUME TEXT:
"""${text.slice(0, 8000)}"""

Return JSON with this exact shape:
{
  "skills": string[],
  "education": [{ "institution": string, "degree": string, "field": string, "year": string }],
  "experience": [{ "title": string, "company": string, "duration": string, "description": string }],
  "projects": [{ "name": string, "description": string, "technologies": string[] }],
  "certifications": string[]
}`;

  const fallback = {
    skills: deterministicSkills,
    education: [],
    experience: [],
    projects: [],
    certifications: [],
  };

  if (!aiService.isConfigured()) {
    return fallback;
  }

  try {
    const structured = await aiService.completeJSON(prompt, fallback);
    // Merge in deterministic skills to avoid losing keyword-dictionary matches
    // the model may have missed.
    const mergedSkills = Array.from(
      new Set([...(structured.skills || []), ...deterministicSkills])
    );
    return { ...fallback, ...structured, skills: mergedSkills };
  } catch (err) {
    logger.error('AI structured extraction failed, using deterministic fallback', {
      error: err.message,
    });
    return fallback;
  }
}

async function parseResume(buffer, mimeType) {
  const text = await extractTextFromBuffer(buffer, mimeType);
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  const structured = await extractStructuredData(cleanedText);
  return { extractedText: cleanedText, ...structured };
}

module.exports = {
  parseResume,
  extractTextFromBuffer,
  extractSkills,
  extractEmails,
  splitSections,
  SKILLS_DICTIONARY,
};
