import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Home, Briefcase, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import Card from './Card';
import { timeAgo } from '../utils/format';

const SOURCE_LABELS = {
  admin: 'CareerTrack',
  remotive: 'Remotive',
  greenhouse: 'Company Careers',
  rss: 'Job Feed',
};

export default function JobCard({ job, isSaved, onToggleSave, matchScore }) {
  const score = matchScore ?? job.matchScore;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link to={`/jobs/${job._id}`} className="font-display text-base font-semibold hover:text-primary">
            {job.title}
          </Link>
          <p className="text-sm text-ink/60 dark:text-paper/60">{job.companyName}</p>
        </div>
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(job)}
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
            className="shrink-0 rounded-lg p-1.5 text-ink/40 hover:bg-paper-line/50 dark:text-paper/40 dark:hover:bg-ink-line/50"
          >
            {isSaved ? <BookmarkCheck size={18} className="text-primary" /> : <Bookmark size={18} />}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60 dark:text-paper/60">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
        )}
        <span className="flex items-center gap-1"><Home size={12} /> {job.workMode}</span>
        <span className="flex items-center gap-1"><Briefcase size={12} /> {job.employmentType}</span>
        {job.salary && <span className="font-data font-medium text-ink dark:text-paper">{job.salary}</span>}
      </div>

      {score != null && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent-dark dark:bg-accent/20 dark:text-accent-light">
          🎯 {score}% Match
        </div>
      )}

      {job.requiredSkills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 5).map((skill) => (
            <span key={skill} className="rounded-full bg-paper-line px-2 py-0.5 text-[11px] font-medium dark:bg-ink-line">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-paper-line pt-3 text-xs text-ink/50 dark:border-ink-line dark:text-paper/50">
        <span className="flex items-center gap-1"><Clock size={11} /> Posted {timeAgo(job.publishedAt)}</span>
        <span className="rounded-full bg-paper-line px-2 py-0.5 font-medium dark:bg-ink-line">
          {SOURCE_LABELS[job.source] || job.source}
        </span>
      </div>
    </Card>
  );
}
