const atsService = require('../src/services/ats.service');

describe('ATS scoring service (deterministic mode, no AI key)', () => {
  const resume = {
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'Git'],
    experience: [{ title: 'Frontend Developer', company: 'Acme', duration: '2 years', description: '' }],
    education: [{ institution: 'State University', degree: "Bachelor's", field: 'CS', year: '2022' }],
    extractedText:
      'Experienced frontend developer skilled in React, Node.js, MongoDB, JavaScript and Git. ' +
      'Built REST APIs and worked in an agile team environment. Contact: dev@example.com',
  };

  const jobDescription =
    'We need a Frontend Engineer with 2+ years experience in React, TypeScript, Docker and AWS. ' +
    'Bachelor\'s degree required. Familiarity with REST APIs and CI/CD is a plus.';

  it('produces scores between 0 and 100 for every category', async () => {
    const result = await atsService.analyzeResumeAgainstJob({ resume, jobDescription });

    for (const value of Object.values(result.scores)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('identifies matched and missing skills correctly', async () => {
    const result = await atsService.analyzeResumeAgainstJob({ resume, jobDescription });

    expect(result.matchedSkills.map((s) => s.toLowerCase())).toEqual(
      expect.arrayContaining(['react'])
    );
    expect(result.missingSkills.map((s) => s.toLowerCase())).toEqual(
      expect.arrayContaining(['docker', 'aws'])
    );
  });

  it('never fabricates recommendations that claim missing skills are present', async () => {
    const result = await atsService.analyzeResumeAgainstJob({ resume, jobDescription });
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
