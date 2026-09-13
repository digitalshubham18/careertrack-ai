const Parser = require('rss-parser');
const JobProvider = require('./jobProvider');

/**
 * Generic feed provider for permitted, publicly-published job RSS/Atom
 * feeds that an admin explicitly configures (e.g. a job board's official
 * "subscribe via RSS" feed, offered specifically for this kind of
 * aggregation). This never crawls or scrapes a page - it only reads a feed
 * URL the admin has vetted and provided.
 *
 * Config shape (per JobSource document of type 'rss'):
 *   {
 *     feedUrl: 'https://example.com/jobs.rss',
 *     companyName: 'Multiple Companies',   // fallback if the feed is multi-company
 *     defaultWorkMode: 'Remote',           // fallback work mode
 *     titleSeparator: ':'                  // many job feeds format titles as "Company: Job Title"
 *   }
 */
const parser = new Parser();

class RssFeedProvider extends JobProvider {
  // eslint-disable-next-line class-methods-use-this
  getSourceName() {
    return 'rss';
  }

  async fetchRawJobs() {
    const { feedUrl } = this.config;
    if (!feedUrl) throw new Error('RSS provider requires config.feedUrl');

    const feed = await parser.parseURL(feedUrl);
    return feed.items || [];
  }

  normalizeJob(raw) {
    const separator = this.config.titleSeparator || ':';
    let companyName = this.config.companyName || 'Multiple Companies';
    let title = raw.title || '';

    // Many job feeds (e.g. remote job boards) format the title as
    // "Company: Job Title" - split on that convention when present.
    if (title.includes(separator)) {
      const [maybeCompany, ...rest] = title.split(separator);
      if (rest.length && maybeCompany.trim().length < 60) {
        companyName = maybeCompany.trim();
        title = rest.join(separator).trim();
      }
    }

    const description = raw.contentSnippet || raw.content || raw.summary || '';
    const publishedAt = raw.isoDate ? new Date(raw.isoDate) : raw.pubDate ? new Date(raw.pubDate) : new Date();

    return {
      title,
      companyName,
      companyLogo: '',
      description: description.slice(0, 5000),
      requiredSkills: [],
      preferredSkills: [],
      experience: '',
      salary: '',
      location: Array.isArray(raw.categories) && raw.categories.length ? raw.categories.join(', ') : 'Not specified',
      workMode: this.config.defaultWorkMode || 'Remote',
      employmentType: 'Full-time',
      category: 'Other',
      applicationUrl: raw.link,
      source: 'rss',
      sourceJobId: raw.guid || raw.link,
      sourceName: `RSS Feed — ${this.config.feedUrl}`,
      publishedAt,
    };
  }
}

module.exports = RssFeedProvider;
