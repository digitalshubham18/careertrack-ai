import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Home, Briefcase, DollarSign, Calendar, ExternalLink,
  Bookmark, BookmarkCheck, Target, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobListingService } from '../services/jobListing.service';
import Card from '../components/Card';
import Button from '../components/Button';
import ScoreDial from '../components/ScoreDial';
import { formatDate, timeAgo } from '../utils/format';

const SOURCE_LABELS = {
  admin: 'CareerTrack Admin',
  remotive: 'Remotive',
  greenhouse: 'Company Careers',
  rss: 'Job Feed',
};

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [matching, setMatching] = useState(false);
  const [match, setMatch] = useState(null);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobListingService.get(id);
      setJob(res.data.data.job);
      setIsSaved(res.data.data.isSaved);
    } catch (err) {
      toast.error('Job not found');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  const handleToggleSave = async () => {
    try {
      if (isSaved) await jobListingService.unsave(id);
      else await jobListingService.save(id);
      setIsSaved(!isSaved);
    } catch {
      toast.error('Failed to update saved status');
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await jobListingService.apply(id);
      toast.success('Application tracked! Opening the company site...');
      window.open(res.data.data.applicationUrl, '_blank', 'noopener,noreferrer');
      navigate(`/applications/${res.data.data.application._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleMatch = async () => {
    setMatching(true);
    try {
      const res = await jobListingService.match(id);
      setMatch(res.data.data.match);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not compute match - upload a resume first');
    } finally {
      setMatching(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="grid place-items-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper">
        <ArrowLeft size={16} /> Back to jobs
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">{job.title}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-ink/60 dark:text-paper/60">
                  <Building2 size={15} /> {job.companyName}
                </p>
              </div>
              <button onClick={handleToggleSave} aria-label="Toggle save" className="shrink-0 rounded-lg p-2 hover:bg-paper-line/50 dark:hover:bg-ink-line/50">
                {isSaved ? <BookmarkCheck size={22} className="text-primary" /> : <Bookmark size={22} className="text-ink/40 dark:text-paper/40" />}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <span className="flex items-center gap-1.5 text-ink/70 dark:text-paper/70"><MapPin size={14} /> {job.location || 'Not specified'}</span>
              <span className="flex items-center gap-1.5 text-ink/70 dark:text-paper/70"><Home size={14} /> {job.workMode}</span>
              <span className="flex items-center gap-1.5 text-ink/70 dark:text-paper/70"><Briefcase size={14} /> {job.employmentType}</span>
              {job.salary && <span className="flex items-center gap-1.5 font-data font-medium"><DollarSign size={14} /> {job.salary}</span>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.requiredSkills?.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary-light">{s}</span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleApply} loading={applying}>
                Apply on {SOURCE_LABELS[job.source] || 'Company'} Site <ExternalLink size={14} />
              </Button>
              <Button variant="secondary" onClick={handleMatch} loading={matching}>
                <Target size={14} /> AI Match
              </Button>
            </div>
            <p className="mt-3 text-xs text-ink/50 dark:text-paper/50">
              CareerTrack tracks your application in your dashboard, but you'll complete the actual application on the source site.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="mb-3 font-display text-sm font-semibold">Job Description</h3>
            <p className="whitespace-pre-wrap text-sm text-ink/70 dark:text-paper/70">{job.description}</p>
          </Card>

          {job.preferredSkills?.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-3 font-display text-sm font-semibold">Preferred Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map((s) => (
                  <span key={s} className="rounded-full bg-paper-line px-2.5 py-1 text-xs font-medium dark:bg-ink-line">{s}</span>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {match && (
            <Card className="flex flex-col items-center p-6">
              <ScoreDial score={match.overallScore} label="AI Match Score" />
              <div className="mt-4 w-full space-y-2 text-xs">
                {Object.entries(match.scores).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize text-ink/60 dark:text-paper/60">{key}</span>
                    <span className="font-data font-semibold">{value}%</span>
                  </div>
                ))}
              </div>
              {match.recommendations?.length > 0 && (
                <ul className="mt-4 w-full list-inside list-disc space-y-1 border-t border-paper-line pt-3 text-xs text-ink/60 dark:border-ink-line dark:text-paper/60">
                  {match.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink/50 dark:text-paper/50">Experience</dt><dd>{job.experience || 'Not specified'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/50 dark:text-paper/50">Openings</dt><dd>{job.openings}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/50 dark:text-paper/50">Posted</dt><dd>{timeAgo(job.publishedAt)}</dd></div>
              {job.deadline && (
                <div className="flex justify-between"><dt className="flex items-center gap-1 text-ink/50 dark:text-paper/50"><Calendar size={12} /> Deadline</dt><dd>{formatDate(job.deadline)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-ink/50 dark:text-paper/50">Source</dt><dd>{SOURCE_LABELS[job.source] || job.source}</dd></div>
            </dl>
            {job.alternateSources?.length > 0 && (
              <p className="mt-3 border-t border-paper-line pt-3 text-xs text-ink/50 dark:border-ink-line dark:text-paper/50">
                Also listed via: {job.alternateSources.map((s) => SOURCE_LABELS[s.source] || s.source).join(', ')}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <Link to={`/ats-analyzer`}>
              <Button variant="secondary" className="w-full">Run ATS analysis against this job</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
