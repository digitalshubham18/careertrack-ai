const { categorizeJob } = require('../src/services/jobs/jobCategorization.service');
const { normalizeTitle, normalizeCompany } = require('../src/services/jobs/jobDeduplication.service');
const { computeMatch } = require('../src/services/jobs/jobMatching.service');
const otpService = require('../src/services/otp.service');

describe('jobCategorization.service', () => {
  it('categorizes an internship before a generic SDE title', () => {
    expect(categorizeJob('Software Engineering Intern', 'Join our team')).toBe('Internship');
  });

  it('categorizes frontend roles', () => {
    expect(categorizeJob('Frontend Engineer', 'React and CSS')).toBe('Frontend');
  });

  it('categorizes AI/ML roles', () => {
    expect(categorizeJob('Machine Learning Engineer', 'PyTorch, deep learning')).toBe('AI/ML');
  });

  it('falls back to Other for unrelated roles', () => {
    expect(categorizeJob('Executive Assistant', 'Scheduling and admin support')).toBe('Other');
  });
});

describe('jobDeduplication.service normalization', () => {
  it('normalizes titles consistently regardless of punctuation/case/whitespace', () => {
    expect(normalizeTitle('  Software  Development-Engineer!! ')).toBe('software development engineer');
    expect(normalizeTitle('Software Development Engineer')).toBe(normalizeTitle('  Software  Development-Engineer!! '));
  });

  it('normalizes company names so cross-source matches are found regardless of formatting', () => {
    expect(normalizeCompany('Acme, Inc.')).toBe(normalizeCompany('ACME INC'));
  });
});

describe('jobMatching.service computeMatch', () => {
  const resume = {
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
    experience: [{ title: 'Frontend Dev', company: 'X', duration: '3 years', description: '' }],
    education: [{ institution: 'State U', degree: "Bachelor's", field: 'CS', year: '2021' }],
  };

  it('scores full marks when remote + all skills present', () => {
    const job = {
      requiredSkills: ['React', 'Node.js'],
      description: '1+ years experience required.',
      experienceYears: 1,
      workMode: 'Remote',
      location: 'Remote',
      title: 'Frontend Engineer',
      companyName: 'Acme',
    };
    const result = computeMatch({ resume, user: { preferredLocations: [] }, job });
    expect(result.scores.skills).toBe(100);
    expect(result.scores.location).toBe(100);
    expect(result.missingSkills).toHaveLength(0);
  });

  it('penalizes missing skills and lists them', () => {
    const job = {
      requiredSkills: ['React', 'Node.js', 'AWS', 'Docker'],
      description: '',
      experienceYears: null,
      workMode: 'Remote',
      location: 'Remote',
      title: 'Frontend Engineer',
      companyName: 'Acme',
    };
    const result = computeMatch({ resume, user: { preferredLocations: [] }, job });
    expect(result.scores.skills).toBe(50);
    expect(result.missingSkills).toEqual(expect.arrayContaining(['AWS', 'Docker']));
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('penalizes on-site jobs outside the users preferred locations', () => {
    const job = {
      requiredSkills: ['React'],
      description: '',
      experienceYears: null,
      workMode: 'On-site',
      location: 'Berlin, Germany',
      title: 'Frontend Engineer',
      companyName: 'Acme',
    };
    const result = computeMatch({ resume, user: { preferredLocations: ['bengaluru'] }, job });
    expect(result.scores.location).toBeLessThan(100);
  });
});

describe('otp.service', () => {
  it('generates a 6-digit numeric OTP whose hash verifies correctly', () => {
    const { code, hash } = otpService.generateOtp();
    expect(code).toMatch(/^\d{6}$/);
    expect(otpService.hashOtp(code)).toBe(hash);
  });

  it('rejects an incorrect code', () => {
    const { hash } = otpService.generateOtp();
    expect(otpService.hashOtp('000000')).not.toBe(hash);
  });

  it('enforces the resend cooldown', () => {
    expect(otpService.canResend(null)).toBe(true);
    expect(otpService.canResend(new Date())).toBe(false);
    expect(otpService.resendWaitSeconds(new Date())).toBeGreaterThan(0);
  });
});
