const JobListing = require('../../models/JobListing');

/**
 * Ordered so more specific categories are checked before generic ones
 * (e.g. "Software Engineering Intern" should land in Internship, not SDE).
 */
const RULES = [
  [/\bintern(ship)?\b/i, 'Internship'],
  [/front[\s-]?end/i, 'Frontend'],
  [/back[\s-]?end/i, 'Backend'],
  [/full[\s-]?stack/i, 'Full Stack'],
  [/(machine learning|\bml\b|artificial intelligence|\bai\b|deep learning|nlp|computer vision)/i, 'AI/ML'],
  [/(data scientist|data science|data analyst)/i, 'Data Science'],
  [/(devops|site reliability|\bsre\b|platform engineer)/i, 'DevOps'],
  [/(cloud engineer|aws engineer|azure engineer|cloud architect)/i, 'Cloud'],
  [/(security engineer|cybersecurity|infosec|penetration test)/i, 'Cybersecurity'],
  [/(ios developer|android developer|mobile developer|react native|flutter)/i, 'Mobile'],
  [/(\bqa\b|quality assurance|test engineer|sdet)/i, 'QA'],
  [/(product manager|product owner)/i, 'Product'],
  [/(software (development )?engineer|\bsde\b|\bswe\b|software developer)/i, 'SDE'],
];

function categorizeJob(title = '', description = '') {
  const haystack = `${title} ${description.slice(0, 300)}`;
  for (const [pattern, category] of RULES) {
    if (pattern.test(haystack)) return category;
  }
  return 'Other';
}

module.exports = { categorizeJob, CATEGORIES: JobListing.CATEGORIES };
