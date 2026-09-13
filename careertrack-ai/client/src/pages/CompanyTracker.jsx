import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Building2, Pencil, Trash2, Mail, Phone, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyService } from '../services/company.service';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_STYLES = {
  Watching: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Applied: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
  'In Progress': 'bg-warn/10 text-warn',
  Closed: 'bg-danger/10 text-danger',
};

const emptyForm = { name: '', website: '', location: '', status: 'Watching', recruiterName: '', recruiterEmail: '', recruiterPhone: '', notes: '' };

export default function CompanyTracker() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await companyService.list();
      setCompanies(res.data.data.companies);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (company) => { setEditingId(company._id); setForm(company); setShowForm(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) await companyService.update(editingId, form);
      else await companyService.create(form);
      toast.success(editingId ? 'Company updated' : 'Company added');
      setShowForm(false);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save company');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    await companyService.remove(deleteTarget);
    toast.success('Company removed');
    setDeleteTarget(null);
    fetchCompanies();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Company Tracker</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">Track companies, recruiters, and notes across your search.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Track a company</Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies tracked yet"
          description="Add a company to track recruiter contacts, notes, and application progress in one place."
          action={<Button onClick={openCreate}><Plus size={16} /> Track a company</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map(({ company, stats }) => (
            <Card key={company._id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold">{company.name}</h3>
                  {company.location && <p className="text-xs text-ink/50 dark:text-paper/50">{company.location}</p>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[company.status]}`}>
                  {company.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-data text-lg font-semibold text-primary">{stats.applications}</p>
                  <p className="text-[10px] uppercase text-ink/50 dark:text-paper/50">Applications</p>
                </div>
                <div>
                  <p className="font-data text-lg font-semibold text-accent-dark">{stats.interviews}</p>
                  <p className="text-[10px] uppercase text-ink/50 dark:text-paper/50">Interviews</p>
                </div>
                <div>
                  <p className="font-data text-lg font-semibold text-emerald-600">{stats.offers}</p>
                  <p className="text-[10px] uppercase text-ink/50 dark:text-paper/50">Offers</p>
                </div>
              </div>

              {(company.recruiterName || company.recruiterEmail || company.recruiterPhone) && (
                <div className="mt-4 space-y-1 border-t border-paper-line pt-3 text-xs text-ink/60 dark:border-ink-line dark:text-paper/60">
                  {company.recruiterName && <p className="font-medium text-ink dark:text-paper">{company.recruiterName}</p>}
                  {company.recruiterEmail && <p className="flex items-center gap-1"><Mail size={11} /> {company.recruiterEmail}</p>}
                  {company.recruiterPhone && <p className="flex items-center gap-1"><Phone size={11} /> {company.recruiterPhone}</p>}
                </div>
              )}

              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                  <Globe size={11} /> {company.website}
                </a>
              )}

              {company.notes && (
                <p className="mt-3 border-t border-paper-line pt-3 text-xs text-ink/60 dark:border-ink-line dark:text-paper/60">{company.notes}</p>
              )}

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(company)}><Pencil size={12} /> Edit</Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteTarget(company._id)}><Trash2 size={12} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Company' : 'Track a Company'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Company name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              {['Watching', 'Applied', 'In Progress', 'Closed'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <Input label="Website" placeholder="https://..." value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Recruiter name" value={form.recruiterName} onChange={(e) => setForm((f) => ({ ...f, recruiterName: e.target.value }))} />
            <Input label="Recruiter email" type="email" value={form.recruiterEmail} onChange={(e) => setForm((f) => ({ ...f, recruiterEmail: e.target.value }))} />
          </div>
          <Input label="Recruiter phone" value={form.recruiterPhone} onChange={(e) => setForm((f) => ({ ...f, recruiterPhone: e.target.value }))} />
          <Input label="Notes" textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>{editingId ? 'Save changes' : 'Add company'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Stop tracking this company?"
        description="This only removes it from your tracker - your applications to this company are unaffected."
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
