const { generateInterviewQuestions } = require('../src/services/interview.service');

describe('interview.service field-aware question generation (no AI key required)', () => {
  it('generates ML-specific technical questions for an AI/ML role, not generic web-dev topics', async () => {
    const questions = await generateInterviewQuestions({
      jobTitle: 'Machine Learning Engineer',
      companyName: 'Acme AI',
      jobDescription: 'Build and deploy ML models using PyTorch and TensorFlow.',
      resumeSkills: ['Python'],
    });
    const technicalTopics = questions.filter((q) => q.category === 'Technical').map((q) => q.topic);

    expect(technicalTopics.some((t) => /machine learning|neural|model|data/i.test(t))).toBe(true);
    expect(technicalTopics).not.toContain('MongoDB');
  });

  it('generates infrastructure-specific technical questions for a DevOps role', async () => {
    const questions = await generateInterviewQuestions({
      jobTitle: 'DevOps Engineer',
      companyName: 'CloudCo',
      jobDescription: 'Manage CI/CD pipelines and Kubernetes clusters.',
      resumeSkills: [],
    });
    const technicalTopics = questions.filter((q) => q.category === 'Technical').map((q) => q.topic);

    expect(technicalTopics.some((t) => /ci\/cd|docker|kubernetes|infrastructure|monitoring/i.test(t))).toBe(true);
  });

  it('prioritizes explicit job requiredSkills and category when provided (from a linked JobListing)', async () => {
    const questions = await generateInterviewQuestions({
      jobTitle: 'Frontend Engineer',
      companyName: 'WebCo',
      jobDescription: '',
      resumeSkills: ['CSS'],
      category: 'Frontend',
      requiredSkills: ['React', 'TypeScript'],
    });
    const technicalTopics = questions.filter((q) => q.category === 'Technical').map((q) => q.topic);

    expect(technicalTopics).toEqual(expect.arrayContaining(['React', 'TypeScript']));
  });

  it('always includes behavioral and company/role questions alongside technical ones', async () => {
    const questions = await generateInterviewQuestions({
      jobTitle: 'Backend Engineer',
      companyName: 'Acme',
      jobDescription: 'Build backend systems.',
      resumeSkills: [],
    });
    expect(questions.some((q) => q.category === 'Behavioral')).toBe(true);
    expect(questions.some((q) => q.category === 'Company/Role')).toBe(true);
  });

  it('falls back to sensible generic questions when the field cannot be determined', async () => {
    const questions = await generateInterviewQuestions({
      jobTitle: 'Executive Assistant',
      companyName: 'Acme',
      jobDescription: 'Support scheduling and admin tasks.',
      resumeSkills: [],
    });
    const technical = questions.filter((q) => q.category === 'Technical');
    expect(technical.length).toBeGreaterThan(0);
  });
});
