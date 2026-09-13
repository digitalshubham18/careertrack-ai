import React, { useEffect, useState, useCallback } from 'react';
import { Search, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobListingService } from '../services/jobListing.service';
import JobCard from '../components/JobCard';
import Card from '../components/Card';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import { JOB_CATEGORIES } from '../utils/constants';

const TABS = [
  { key: 'recommended', label: '🔥 Recommended' },
  { key: 'new', label: '🆕 New Jobs' },
  { key: 'sde', label: '💼 SDE Jobs' },
  { key: 'remote', label: '🌎 Remote' },
  { key: 'closing-soon', label: '⏰ Closing Soon' },
  { key: 'saved', label: '🔖 Saved' },
  { key: 'applied', label: '📝 Applied' },
];

const FETCHERS = {
  recommended: jobListingService.getRecommended,
  new: jobListingService.getNew,
  sde: jobListingService.getSde,
  remote: jobListingService.getRemote,
  'closing-soon': jobListingService.getClosingSoon,
  saved: jobListingService.getSaved,
  applied: jobListingService.getApplied,
};

export default function JobListings() {
  const [tab, setTab] = useState('recommended');
  const [jobs, setJobs] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  const fetchSavedIds = useCallback(async () => {
    try {
      const res = await jobListingService.getSaved();
      setSavedIds(new Set(res.data.data.jobs.map((j) => j._id)));
    } catch {
      // non-critical
    }
  }, []);

  const fetchTab = useCallback(async () => {
    setLoading(true);
    setIsSearchMode(false);
    try {
      const res = await FETCHERS[tab]();
      setJobs(res.data.data.jobs);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchTab();
    fetchSavedIds();
  }, [fetchTab, fetchSavedIds]);

  const handleSearch = useCallback(async () => {
    if (!search && !category && !workMode) return fetchTab();
    setLoading(true);
    setIsSearchMode(true);
    try {
      const res = await jobListingService.list({ search, category, workMode, limit: 30 });
      setJobs(res.data.data.jobs);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  }, [search, category, workMode, fetchTab]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (search || category || workMode) handleSearch();
      else if (isSearchMode) fetchTab();
    }, 350);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, workMode]);

  const handleToggleSave = async (job) => {
    const isSaved = savedIds.has(job._id);
    const nextSaved = new Set(savedIds);
    if (isSaved) nextSaved.delete(job._id);
    else nextSaved.add(job._id);
    setSavedIds(nextSaved);

    try {
      if (isSaved) await jobListingService.unsave(job._id);
      else await jobListingService.save(job._id);
      if (tab === 'saved') fetchTab();
    } catch {
      setSavedIds(savedIds); // revert on failure
      toast.error('Failed to update saved jobs');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Discover Jobs</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Automatically aggregated and admin-published SDE roles, matched to your profile.
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, company, skill..."
              className="w-full rounded-xl border border-paper-line bg-paper-soft py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-ink-line dark:bg-ink-soft"
            />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
            <option value="">Any work mode</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </Select>
        </div>
      </Card>

      {!isSearchMode && (
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-primary text-white'
                  : 'bg-paper-soft text-ink/60 hover:bg-paper-line/50 dark:bg-ink-soft dark:text-paper/60 dark:hover:bg-ink-line/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            tab === 'saved'
              ? "You haven't saved any jobs yet."
              : tab === 'applied'
              ? "You haven't applied to any discovered jobs yet."
              : 'Try a different search or check back after the next sync.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              isSaved={savedIds.has(job._id)}
              onToggleSave={handleToggleSave}
              matchScore={job.matchScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}
