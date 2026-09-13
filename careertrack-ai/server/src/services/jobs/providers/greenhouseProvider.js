const JobProvider = require('./jobProvider');

/**
 * Greenhouse's Job Board API (https://developers.greenhouse.io/job-board.html)
 * is a free, public, unauthenticated, documented API. Any company using
 * Greenhouse as their ATS exposes their open roles at:
 *
 *   https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 *
 * The `board_token` is a public identifier (visible in the company's own
 * public career page URL), not a secret. This is exactly the "permitted
 * company career-page integration" the platform is meant to use - it is the
 * intended, documented way to read a Greenhouse-hosted board's postings.
 *
 * Config shape (per JobSource document of type 'greenhouse'):
 *   { boardToken: 'acme', companyName: 'Acme Inc', companyLogo: 'https://...' }
 */
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

class GreenhouseProvider extends JobProvider {
  // eslint-disable-next-line class-methods-use-this
  getSourceName() {
    return 'greenhouse';
  }

  async fetchRawJobs() {
    const { boardToken } = this.config;
    if (!boardToken) {
      throw new Error('Greenhouse provider requires config.boardToken');
    }

    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`Greenhouse API responded with ${response.status} for board "${boardToken}"`);
    }

    const data = await response.json();
    return Array.isArray(data.jobs) ? data.jobs : [];
  }

  normalizeJob(raw) {
    const location = raw.location?.name || '';
    const isRemote = /remote/i.test(location);

    return {
      title: raw.title,
      companyName: this.config.companyName || 'Unknown Company',
      companyLogo: this.config.companyLogo || '',
      description: stripHtml(raw.content),
      requiredSkills: [],
      preferredSkills: [],
      experience: '',
      salary: '',
      location: location || 'Not specified',
      workMode: isRemote ? 'Remote' : 'On-site',
      employmentType: 'Full-time',
      category: 'Other', // refined later by the AI categorization step in jobAggregator
      applicationUrl: raw.absolute_url,
      source: 'greenhouse',
      sourceJobId: String(raw.id),
      sourceName: `Greenhouse — ${this.config.companyName || this.config.boardToken}`,
      publishedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(),
    };
  }
}

module.exports = GreenhouseProvider;
