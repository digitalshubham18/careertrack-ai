const JobProvider = require('./jobProvider');
const logger = require('../../../utils/logger');

/**
 * Remotive (https://remotive.com/api-documentation) publishes a free, public,
 * unauthenticated JSON API explicitly documented for external consumption -
 * no scraping, no auth bypass, no ToS violation. No API key required.
 */
const REMOTIVE_ENDPOINT = 'https://remotive.com/api/remote-jobs';

const EMPLOYMENT_TYPE_MAP = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Contract',
};

const CATEGORY_MAP = {
  'software development': 'SDE',
  'data science': 'Data Science',
  devops: 'DevOps',
  'product': 'Product',
  qa: 'QA',
  design: 'Other',
  'customer support': 'Other',
  'sales / business': 'Other',
  marketing: 'Other',
  'all others': 'Other',
};

function stripHtml(html = '') {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

class RemotiveProvider extends JobProvider {
  // eslint-disable-next-line class-methods-use-this
  getSourceName() {
    return 'remotive';
  }

  async fetchRawJobs() {
    const params = new URLSearchParams();
    if (this.config.category) params.set('category', this.config.category);
    if (this.config.search) params.set('search', this.config.search);
    const limit = this.config.limit || 100;
    params.set('limit', String(limit));

    const url = `${REMOTIVE_ENDPOINT}?${params.toString()}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`Remotive API responded with ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.jobs)) {
      logger.warn('Remotive API returned an unexpected shape - skipping this sync');
      return [];
    }
    return data.jobs;
  }

  // eslint-disable-next-line class-methods-use-this
  normalizeJob(raw) {
    const categoryKey = (raw.category || '').toLowerCase().trim();

    return {
      title: raw.title,
      companyName: raw.company_name,
      companyLogo: raw.company_logo || '',
      description: stripHtml(raw.description),
      requiredSkills: Array.isArray(raw.tags) ? raw.tags.slice(0, 15) : [],
      preferredSkills: [],
      experience: '',
      salary: raw.salary || '',
      location: raw.candidate_required_location || 'Remote',
      workMode: 'Remote',
      employmentType: EMPLOYMENT_TYPE_MAP[raw.job_type] || 'Full-time',
      category: CATEGORY_MAP[categoryKey] || 'Other',
      applicationUrl: raw.url,
      source: 'remotive',
      sourceJobId: String(raw.id),
      sourceName: 'Remotive',
      publishedAt: raw.publication_date ? new Date(raw.publication_date) : new Date(),
    };
  }
}

module.exports = RemotiveProvider;
