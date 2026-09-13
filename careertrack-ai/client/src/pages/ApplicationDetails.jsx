import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Calendar, DollarSign, ExternalLink, MessageSquareText,
  Target, Trash2, Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobService } from '../services/job.service';
import { formatDate, formatDateTime } from '../utils/format';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import ScoreDial from '../components/ScoreDial';
import ApplicationFormModal from '../components/ApplicationFormModal';
import ApplicationAssistantCard from '../components/ApplicationAssistantCard';
import ConfirmDialog from '../components/ConfirmDialog';
import { STATUSES } from '../utils/constants';

const ACTIVITY_LABELS = {
  application_created: 'Application created',
  resume_analyzed: 'Resume analyzed',
  status_changed: 'Status changed',
  interview_scheduled: 'Interview prep generated',
  note_added: 'Note updated',
  application_updated: 'Application updated',
};

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobService.get(id);
      setApplication(res.data.data.application);
      setActivity(res.data.data.activity);
      setNotes(res.data.data.application.notes || '');
    } catch (err) {
      toast.error('Application not found');
      navigate('/applications');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchApplication(); }, [fetchApplication]);

  const handleStatusChange = async (status) => {
    await jobService.updateStatus(id, status);
    fetchApplication();
    toast.success('Status updated');
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await jobService.updateNotes(id, notes);
      toast.success('Notes saved');
      fetchApplication();
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEdit = async (data) => {
    await jobService.update(id, data);
    toast.success('Application updated');
    setShowEdit(false);
    fetchApplication();
  };

  const handleDelete = async () => {
    await jobService.remove(id);
    toast.success('Application deleted');
    navigate('/applications');
  };

  if (loading || !application) {
    return (
      <div className="grid place-items-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/applications')} className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper">
        <ArrowLeft size={16} /> Back to applications
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">{application.jobTitle}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink/60 dark:text-paper/60">
            <span className="flex items-center gap-1"><Building2 size={14} /> {application.companyName}</span>
            {application.location && <span className="flex items-center gap-1"><MapPin size={14} /> {application.location}</span>}
            {application.salaryRange && <span className="flex items-center gap-1"><DollarSign size={14} /> {application.salaryRange}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowEdit(true)}><Pencil size={14} /> Edit</Button>
          <Button variant="danger" onClick={() => setShowDelete(true)}><Trash2 size={14} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={application.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-auto">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
              <PriorityBadge priority={application.priority} />
              {application.jobUrl && (
                <a href={application.jobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  View posting <ExternalLink size={13} />
                </a>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-ink/50 dark:text-paper/50">Applied</p>
                <p className="mt-0.5 font-medium">{formatDate(application.applicationDate)}</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 dark:text-paper/50">Deadline</p>
                <p className="mt-0.5 font-medium">{formatDate(application.deadline)}</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 dark:text-paper/50">Interview</p>
                <p className="mt-0.5 font-medium">{formatDateTime(application.interviewDate)}</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 dark:text-paper/50">Follow-up</p>
                <p className="mt-0.5 font-medium">{formatDate(application.followUpDate)}</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 dark:text-paper/50">Contact</p>
                <p className="mt-0.5 font-medium">{application.contactPerson || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-ink/50 dark:text-paper/50">Resume used</p>
                <p className="mt-0.5 font-medium">{application.resumeUsed?.originalFilename || '—'}</p>
              </div>
            </div>
          </Card>

          {application.jobDescription && (
            <Card className="p-5">
              <h3 className="mb-2 font-display text-sm font-semibold">Job description</h3>
              <p className="whitespace-pre-wrap text-sm text-ink/70 dark:text-paper/70">{application.jobDescription}</p>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold">Notes</h3>
            <Input textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add private notes about this application..." />
            <div className="mt-3 flex justify-end">
              <Button size="sm" loading={savingNotes} onClick={handleSaveNotes}>Save notes</Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold">Activity timeline</h3>
            <ol className="relative space-y-6 border-l border-paper-line pl-5 dark:border-ink-line">
              {activity.map((item) => (
                <li key={item._id} className="relative">
                  <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-paper-soft bg-primary dark:border-ink-soft" />
                  <p className="text-xs font-medium text-ink/50 dark:text-paper/50">{formatDateTime(item.createdAt)}</p>
                  <p className="text-sm">{item.description || ACTIVITY_LABELS[item.type]}</p>
                </li>
              ))}
              {activity.length === 0 && <p className="text-sm text-ink/50 dark:text-paper/50">No activity yet.</p>}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="flex flex-col items-center p-5">
            <h3 className="mb-3 self-start font-display text-sm font-semibold">ATS Score</h3>
            {application.atsScore != null ? (
              <>
                <ScoreDial score={application.atsScore} />
                <Link to="/ats-analyzer" state={{ jobApplicationId: application._id }} className="mt-4 w-full">
                  <Button variant="secondary" className="w-full"><Target size={14} /> Re-analyze</Button>
                </Link>
              </>
            ) : (
              <div className="w-full py-4 text-center">
                <p className="mb-3 text-sm text-ink/60 dark:text-paper/60">No ATS analysis yet.</p>
                <Link to="/ats-analyzer" state={{ jobApplicationId: application._id }}>
                  <Button className="w-full"><Target size={14} /> Analyze resume</Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold">Interview preparation</h3>
            <p className="mb-3 text-sm text-ink/60 dark:text-paper/60">
              Generate technical, behavioral, and role-specific questions for this application.
            </p>
            <Link to="/interview-prep" state={{ jobApplicationId: application._id }}>
              <Button variant="secondary" className="w-full"><MessageSquareText size={14} /> Prepare for interview</Button>
            </Link>
          </Card>

          <ApplicationAssistantCard applicationId={application._id} />
        </div>
      </div>

      <ApplicationFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={handleEdit}
        defaultValues={{
          ...application,
          deadline: application.deadline?.slice(0, 10) || '',
          interviewDate: application.interviewDate?.slice(0, 16) || '',
          followUpDate: application.followUpDate?.slice(0, 10) || '',
        }}
      />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete application?"
        description="This will permanently delete this application and its activity history."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
