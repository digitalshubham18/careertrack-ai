import React, { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle2, XCircle, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminJobListingService } from '../services/adminJobListing.service';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { JOB_CATEGORIES } from '../utils/constants';
import { formatDate } from '../utils/format';

const emptyForm = {
  title: '', companyName: '', companyLogo: '', description: '', requiredSkills: '', preferredSkills: '',
  experience: '', salary: '', location: '', workMode: 'On-site', employmentType: 'Full-time',
  category: 'SDE', applicationUrl: '', openings: 1, deadline: '', status: 'DRAFT',
};

export default function AdminJobListings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      const res = await adminJobListingService.list(params);
      setJobs(res.data.data.jobs);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (job) => {
    setEditingId(job._id);
    setForm({
      ...job,
      requiredSkills: (job.requiredSkills || []).join(', '),
      preferredSkills: (job.preferredSkills || []).join(', '),
      deadline: job.deadline ? job.deadline.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      preferredSkills: form.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      openings: Number(form.openings) || 1,
      deadline: form.deadline || null,
    };
    try {
      if (editingId) await adminJobListingService.update(editingId, payload);
      else await adminJobListingService.create(payload);
      toast.success(editingId ? 'Job updated' : 'Job created');
      setShowForm(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save job');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (job) => {
    await adminJobListingService.publish(job._id);
    toast.success('Job published — visible to all users');
    fetchJobs();
  };

  const handleClose = async (job) => {
    await adminJobListingService.close(job._id);
    toast.success('Job closed');
    fetchJobs();
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}" at ${job.companyName}?`)) return;
    await adminJobListingService.remove(job._id);
    toast.success('Job deleted');
    fetchJobs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Manage Job Listings</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">Create, publish, and manage every job on the platform.</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> New Job</Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
            <option value="EXPIRED">Expired</option>
          </Select>
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All sources</option>
            <option value="admin">Admin</option>
            <option value="remotive">Remotive</option>
            <option value="greenhouse">Greenhouse</option>
            <option value="rss">RSS Feed</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs found" description="Adjust filters or create a new job listing." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-paper-line text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:text-paper/50">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Views</th>
                <th className="px-5 py-3 font-medium">Applies</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id} className="border-b border-paper-line last:border-0 dark:border-ink-line">
                  <td className="px-5 py-3 font-medium">{job.title}</td>
                  <td className="px-5 py-3">{job.companyName}</td>
                  <td className="px-5 py-3 capitalize">{job.source}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-paper-line px-2 py-0.5 text-xs font-semibold dark:bg-ink-line">{job.status}</span>
                  </td>
                  <td className="px-5 py-3 font-data">{job.viewCount}</td>
                  <td className="px-5 py-3 font-data">{job.applyCount}</td>
                  <td className="px-5 py-3 text-ink/60 dark:text-paper/60">{formatDate(job.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5">
                      {job.source === 'admin' && (
                        <Button size="sm" variant="secondary" onClick={() => openEdit(job)}><Pencil size={12} /></Button>
                      )}
                      {job.status !== 'PUBLISHED' && (
                        <Button size="sm" variant="secondary" onClick={() => handlePublish(job)}><CheckCircle2 size={12} /></Button>
                      )}
                      {job.status === 'PUBLISHED' && (
                        <Button size="sm" variant="secondary" onClick={() => handleClose(job)}><XCircle size={12} /></Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(job)}><Trash2 size={12} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Job' : 'New Job'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Job title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <Input label="Company name" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} required />
            <Input label="Company logo URL" value={form.companyLogo} onChange={(e) => setForm((f) => ({ ...f, companyLogo: e.target.value }))} />
            <Input label="Application URL" value={form.applicationUrl} onChange={(e) => setForm((f) => ({ ...f, applicationUrl: e.target.value }))} required />
            <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <Select label="Work mode" value={form.workMode} onChange={(e) => setForm((f) => ({ ...f, workMode: e.target.value }))}>
              {['On-site', 'Hybrid', 'Remote'].map((m) => <option key={m}>{m}</option>)}
            </Select>
            <Select label="Employment type" value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}>
              {['Full-time', 'Part-time', 'Internship', 'Contract'].map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Select label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {JOB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Experience" placeholder="e.g. 2-4 years" value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} />
            <Input label="Salary" placeholder="e.g. ₹15L - ₹25L" value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} />
            <Input label="Openings" type="number" min="1" value={form.openings} onChange={(e) => setForm((f) => ({ ...f, openings: e.target.value }))} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
          </div>
          <Input label="Required skills (comma-separated)" value={form.requiredSkills} onChange={(e) => setForm((f) => ({ ...f, requiredSkills: e.target.value }))} />
          <Input label="Preferred skills (comma-separated)" value={form.preferredSkills} onChange={(e) => setForm((f) => ({ ...f, preferredSkills: e.target.value }))} />
          <Input label="Description" textarea rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published (visible to all users)</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingId ? 'Save changes' : 'Create job'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
