import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List as ListIcon, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobService } from '../services/job.service';
import { STATUSES } from '../utils/constants';
import { formatDate } from '../utils/format';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import KanbanBoard from '../components/KanbanBoard';
import ApplicationFormModal from '../components/ApplicationFormModal';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sort: 'newest' });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await jobService.list(params);
      setApplications(res.data.data.applications);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const debounce = setTimeout(fetchApplications, 300);
    return () => clearTimeout(debounce);
  }, [fetchApplications]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await jobService.create(data);
      toast.success('Application created');
      setShowCreate(false);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    const previous = applications;
    setApplications((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));
    try {
      await jobService.updateStatus(id, status);
    } catch (err) {
      setApplications(previous);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Applications</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">Manage and track every job application.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-paper-line p-1 dark:border-ink-line">
            <button
              onClick={() => setView('table')}
              className={`rounded-lg p-1.5 ${view === 'table' ? 'bg-primary text-white' : 'text-ink/50 dark:text-paper/50'}`}
              aria-label="Table view"
            >
              <ListIcon size={16} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`rounded-lg p-1.5 ${view === 'kanban' ? 'bg-primary text-white' : 'text-ink/50 dark:text-paper/50'}`}
              aria-label="Kanban view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New application
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search company or title..."
              className="w-full rounded-xl border border-paper-line bg-paper-soft py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-ink-line dark:bg-ink-soft"
            />
          </div>
          <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
            <option value="">All priorities</option>
            {['Low', 'Medium', 'High'].map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <Select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highestAts">Highest ATS score</option>
            <option value="priority">Priority</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications found"
          description="Try adjusting your filters, or create a new application to get started."
          action={<Button onClick={() => setShowCreate(true)}><Plus size={16} /> New application</Button>}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard applications={applications} onStatusChange={handleStatusChange} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:text-paper/50">
              <tr>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Job title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">ATS score</th>
                <th className="px-5 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} className="border-b border-paper-line last:border-0 hover:bg-paper-line/30 dark:border-ink-line dark:hover:bg-ink-line/30">
                  <td className="px-5 py-3">
                    <Link to={`/applications/${app._id}`} className="font-medium text-primary hover:underline">
                      {app.companyName}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{app.jobTitle}</td>
                  <td className="px-5 py-3"><StatusBadge status={app.status} /></td>
                  <td className="px-5 py-3"><PriorityBadge priority={app.priority} /></td>
                  <td className="px-5 py-3 font-data">{app.atsScore != null ? `${app.atsScore}/100` : '—'}</td>
                  <td className="px-5 py-3 text-ink/60 dark:text-paper/60">{formatDate(app.applicationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ApplicationFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </div>
  );
}
