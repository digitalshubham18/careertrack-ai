/**
 * Seeds a demo admin + regular user so the app can be explored immediately.
 * Run with: node src/utils/seed.js
 */
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const JobSource = require('../models/JobSource');
const JobListing = require('../models/JobListing');
const { normalizeTitle, normalizeCompany } = require('../services/jobs/jobDeduplication.service');
const { categorizeJob } = require('../services/jobs/jobCategorization.service');

async function seed() {
  await mongoose.connect(env.mongoUri);

  await User.deleteMany({ email: { $in: ['admin@careertrack.ai', 'demo@careertrack.ai'] } });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@careertrack.ai',
    password: 'Admin@12345',
    role: 'admin',
    isEmailVerified: true,
  });

  const demoUser = await User.create({
    name: 'Demo Candidate',
    email: 'demo@careertrack.ai',
    password: 'Demo@12345',
    role: 'user',
    isEmailVerified: true,
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript', 'REST APIs', 'Git'],
  });

  await JobApplication.create([
    {
      user: demoUser._id,
      companyName: 'Nimbus Tech',
      jobTitle: 'Frontend Engineer',
      location: 'Remote',
      status: 'Applied',
      priority: 'High',
      jobDescription: 'We are looking for a React developer with experience in TypeScript, REST APIs, and Docker.',
    },
    {
      user: demoUser._id,
      companyName: 'Bluewave Labs',
      jobTitle: 'Full Stack Developer',
      location: 'Bengaluru, India',
      status: 'Interview',
      priority: 'Medium',
      jobDescription: 'Full stack role requiring Node.js, MongoDB, AWS and CI/CD experience.',
    },
  ]);

  // --- Job sources ---
  // Remotive: public, unauthenticated, no config required - enabled by
  // default so automatic job discovery works immediately after seeding.
  await JobSource.deleteMany({ name: { $in: ['Remotive', 'We Work Remotely (Programming)'] } });
  await JobSource.create({
    name: 'Remotive',
    type: 'remotive',
    enabled: true,
    config: { category: 'software-dev', limit: 50 },
  });

  // A real, publicly-offered RSS job feed as a second example source -
  // left DISABLED by default since it's a network-dependent third party the
  // admin should consciously opt into, per the "admin can enable/disable
  // sources" requirement.
  await JobSource.create({
    name: 'We Work Remotely (Programming)',
    type: 'rss',
    enabled: false,
    config: {
      feedUrl: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
      defaultWorkMode: 'Remote',
      titleSeparator: ':',
    },
  });

  // --- Sample admin-published SDE jobs (spec #76) ---
  await JobListing.deleteMany({ source: 'admin' });
  const sampleJobs = [
    {
      title: 'Software Development Engineer',
      companyName: 'Google',
      location: 'Bengaluru, India',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      salary: '₹18L - ₹32L',
      experience: '1-3 years',
      requiredSkills: ['Java', 'System Design', 'Data Structures', 'Algorithms'],
      preferredSkills: ['Go', 'Kubernetes'],
      description:
        'Design, build, and maintain large-scale distributed systems. Collaborate with cross-functional teams to ship reliable, high-performance software used by billions of users.',
      applicationUrl: 'https://careers.google.com/jobs/results/',
    },
    {
      title: 'Frontend Engineer',
      companyName: 'Microsoft',
      location: 'Hyderabad, India',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      salary: '₹15L - ₹28L',
      experience: '2-4 years',
      requiredSkills: ['React', 'TypeScript', 'CSS', 'REST APIs'],
      preferredSkills: ['Next.js', 'GraphQL'],
      description:
        'Build polished, accessible user interfaces for Microsoft 365 products. Work closely with designers and backend engineers to deliver end-to-end features.',
      applicationUrl: 'https://careers.microsoft.com/',
    },
    {
      title: 'Backend Engineer',
      companyName: 'Flipkart',
      location: 'Bengaluru, India',
      workMode: 'On-site',
      employmentType: 'Full-time',
      salary: '₹20L - ₹35L',
      experience: '3-5 years',
      requiredSkills: ['Java', 'Spring Boot', 'MySQL', 'Kafka'],
      preferredSkills: ['Redis', 'Docker'],
      description:
        'Own critical backend services powering millions of daily transactions. Design for scale, reliability, and low latency across our commerce platform.',
      applicationUrl: 'https://www.flipkartcareers.com/',
    },
    {
      title: 'Full Stack Developer',
      companyName: 'Razorpay',
      location: 'Remote',
      workMode: 'Remote',
      employmentType: 'Full-time',
      salary: '₹16L - ₹26L',
      experience: '2-4 years',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
      preferredSkills: ['AWS', 'Docker'],
      description:
        'Build and ship full-stack features across our payments dashboard, from database schema to polished React UI, in a fully remote team.',
      applicationUrl: 'https://razorpay.com/jobs/',
    },
    {
      title: 'AI/ML Engineer',
      companyName: 'Amazon',
      location: 'Bengaluru, India',
      workMode: 'Hybrid',
      employmentType: 'Full-time',
      salary: '₹22L - ₹38L',
      experience: '2-5 years',
      requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'AWS'],
      preferredSkills: ['PyTorch', 'MLOps'],
      description:
        'Develop and deploy machine learning models that power product recommendations and search relevance at scale.',
      applicationUrl: 'https://www.amazon.jobs/',
    },
  ];

  for (const job of sampleJobs) {
    await JobListing.create({
      ...job,
      normalizedTitle: normalizeTitle(job.title),
      normalizedCompany: normalizeCompany(job.companyName),
      category: categorizeJob(job.title, job.description),
      source: 'admin',
      sourceJobId: `admin-${crypto.randomUUID()}`,
      sourceName: 'CareerTrack Admin',
      createdBy: admin._id,
      status: 'PUBLISHED',
      openings: 2,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      lastUpdatedAt: new Date(),
      publishedAt: new Date(),
    });
  }

  console.log('Seed complete:');
  console.log('  Admin  -> admin@careertrack.ai / Admin@12345');
  console.log('  Demo   -> demo@careertrack.ai / Demo@12345');
  console.log(`  Seeded ${sampleJobs.length} admin job listings + 2 job sources (Remotive enabled, WWR RSS disabled)`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
