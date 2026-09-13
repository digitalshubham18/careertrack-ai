import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Star, Trash2, Download, Loader2, PenSquare, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeService } from '../services/resume.service';
import { resumeBuilderService } from '../services/resumeBuilder.service';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/format';

const PARSE_STATUS_LABEL = {
  pending: { text: 'Parsing...', className: 'text-warn' },
  parsed: { text: 'Parsed', className: 'text-accent-dark' },
  failed: { text: 'Parsing failed', className: 'text-danger' },
};

export default function ResumeManager() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef(null);

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resumeService.list();
      setResumes(res.data.data.resumes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
    // Poll briefly to reflect background parsing completion.
    const interval = setInterval(fetchResumes, 4000);
    return () => clearInterval(interval);
  }, [fetchResumes]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      toast.error('Only PDF and DOCX files are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      await resumeService.upload(file);
      toast.success('Resume uploaded! Parsing in the background...');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateDraft = async () => {
    setCreatingDraft(true);
    try {
      const res = await resumeBuilderService.createDraft();
      navigate(`/resume-builder/${res.data.data.resume._id}`);
    } catch (err) {
      toast.error('Failed to create resume draft');
    } finally {
      setCreatingDraft(false);
    }
  };

  const handleSetPrimary = async (id) => {
    await resumeService.setPrimary(id);
    toast.success('Primary resume updated');
    fetchResumes();
  };

  const handleDelete = async () => {
    await resumeService.remove(deleteTarget);
    toast.success('Resume deleted');
    setDeleteTarget(null);
    fetchResumes();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Resume Manager</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">Upload, build, and manage multiple resume versions.</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileSelect} />
          <Button variant="secondary" onClick={handleCreateDraft} loading={creatingDraft}>
            <PenSquare size={16} /> Build a resume
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} loading={uploading}>
            <Upload size={16} /> Upload resume
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : resumes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Upload a PDF/DOCX resume, or build one from scratch with AI assistance."
          action={
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={handleCreateDraft} loading={creatingDraft}><Plus size={16} /> Build a resume</Button>
              <Button onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Upload resume</Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume._id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary dark:bg-primary/20 dark:text-primary-light">
                  <FileText size={20} />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {resume.isPrimary && (
                    <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent-dark dark:bg-accent/20 dark:text-accent-light">
                      <Star size={11} fill="currentColor" /> Primary
                    </span>
                  )}
                  {resume.origin === 'builder' && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-primary-light">
                      Builder
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-3 truncate text-sm font-semibold" title={resume.originalFilename}>
                {resume.originalFilename}
              </p>
              <p className="text-xs text-ink/50 dark:text-paper/50">
                {resume.origin === 'builder' ? 'Created' : 'Uploaded'} {formatDate(resume.createdAt)} · v{resume.version}
              </p>

              {resume.origin === 'uploaded' && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                  {resume.parseStatus === 'pending' && <Loader2 size={12} className="animate-spin" />}
                  <span className={PARSE_STATUS_LABEL[resume.parseStatus].className}>
                    {PARSE_STATUS_LABEL[resume.parseStatus].text}
                  </span>
                </div>
              )}

              {resume.skills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {resume.skills.slice(0, 6).map((skill) => (
                    <span key={skill} className="rounded-full bg-paper-line px-2 py-0.5 text-[11px] font-medium dark:bg-ink-line">
                      {skill}
                    </span>
                  ))}
                  {resume.skills.length > 6 && (
                    <span className="rounded-full bg-paper-line px-2 py-0.5 text-[11px] font-medium dark:bg-ink-line">
                      +{resume.skills.length - 6}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                {resume.origin === 'builder' ? (
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/resume-builder/${resume._id}`)}>
                    <PenSquare size={13} /> Edit
                  </Button>
                ) : (
                  <a href={resume.storageUrl} target="_blank" rel="noreferrer" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full"><Download size={13} /> View</Button>
                  </a>
                )}
                {!resume.isPrimary && (
                  <Button variant="secondary" size="sm" onClick={() => handleSetPrimary(resume._id)} aria-label="Set as primary">
                    <Star size={13} />
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(resume._id)} aria-label="Delete resume">
                  <Trash2 size={13} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete resume?"
        description="This will permanently delete this resume and its data."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
