import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Sparkles, Download, Save, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeService } from '../services/resume.service';
import { resumeBuilderService } from '../services/resumeBuilder.service';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

function ChipList({ items, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const value = input.trim();
    if (value && !items.includes(value)) onChange([...items, value]);
    setInput('');
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary-light">
            {item}
            <button type="button" onClick={() => onChange(items.filter((i) => i !== item))} aria-label={`Remove ${item}`}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="secondary" onClick={add}><Plus size={16} /></Button>
      </div>
    </div>
  );
}

export default function ResumeBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [improvingIndex, setImprovingIndex] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [keywordSuggestions, setKeywordSuggestions] = useState('');
  const [optimizing, setOptimizing] = useState(false);

  const fetchResume = useCallback(async () => {
    setLoading(true);
    try {
      const res = await resumeService.get(id);
      setResume(res.data.data.resume);
    } catch {
      toast.error('Resume draft not found');
      navigate('/resumes');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchResume(); }, [fetchResume]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { summary, skills, education, experience, projects, certifications, achievements } = resume;
      const res = await resumeBuilderService.updateDraft(id, {
        summary, skills, education, experience, projects, certifications, achievements,
      });
      setResume(res.data.data.resume);
      toast.success('Draft saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await handleSave();
      const res = await resumeBuilderService.exportPdf(id);
      toast.success('PDF exported!');
      window.open(res.data.data.resume.storageUrl, '_blank', 'noopener,noreferrer');
      setResume(res.data.data.resume);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    try {
      const res = await resumeBuilderService.generateSummary(id, targetRole);
      setResume((r) => ({ ...r, summary: res.data.data.summary }));
      toast.success('Summary generated - review and edit as needed');
    } catch (err) {
      toast.error('Failed to generate summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleImproveBullet = async (section, index) => {
    const item = resume[section][index];
    const key = `${section}-${index}`;
    setImprovingIndex(key);
    try {
      const context = section === 'experience' ? `${item.title} at ${item.company}` : item.name;
      const res = await resumeBuilderService.improveBullet(id, item.description, context);
      updateArrayItem(section, index, 'description', res.data.data.improved);
      toast.success('Suggestion applied - review and edit as needed');
    } catch (err) {
      toast.error('Failed to generate suggestion');
    } finally {
      setImprovingIndex(null);
    }
  };

  const handleOptimizeKeywords = async () => {
    if (!jobDescription.trim()) return toast.error('Paste a job description first');
    setOptimizing(true);
    try {
      const res = await resumeBuilderService.optimizeKeywords(id, jobDescription);
      setKeywordSuggestions(res.data.data.suggestions);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate suggestions');
    } finally {
      setOptimizing(false);
    }
  };

  const updateArrayItem = (section, index, field, value) => {
    setResume((r) => {
      const arr = [...r[section]];
      arr[index] = { ...arr[index], [field]: value };
      return { ...r, [section]: arr };
    });
  };

  const addArrayItem = (section, template) => {
    setResume((r) => ({ ...r, [section]: [...r[section], template] }));
  };

  const removeArrayItem = (section, index) => {
    setResume((r) => ({ ...r, [section]: r[section].filter((_, i) => i !== index) }));
  };

  if (loading || !resume) {
    return (
      <div className="grid place-items-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate('/resumes')} className="flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper">
        <ArrowLeft size={16} /> Back to resumes
      </button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Resume Builder</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">Build a structured resume with AI assistance, then export to PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSave} loading={saving}><Save size={15} /> Save</Button>
          <Button onClick={handleExport} loading={exporting}><Download size={15} /> Export PDF</Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="p-5">
        <h3 className="mb-3 font-display text-sm font-semibold">Professional Summary</h3>
        <Input textarea rows={3} value={resume.summary} onChange={(e) => setResume((r) => ({ ...r, summary: e.target.value }))} placeholder="A 2-3 sentence summary of your background..." />
        <div className="mt-3 flex items-center gap-2">
          <Input placeholder="Target role (optional, e.g. Senior Frontend Engineer)" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
          <Button variant="secondary" size="sm" onClick={handleGenerateSummary} loading={generatingSummary}>
            <Sparkles size={13} /> Generate
          </Button>
        </div>
      </Card>

      {/* Skills */}
      <Card className="p-5">
        <h3 className="mb-3 font-display text-sm font-semibold">Skills</h3>
        <ChipList items={resume.skills} onChange={(skills) => setResume((r) => ({ ...r, skills }))} placeholder="Add a skill and press Enter" />
      </Card>

      {/* Experience */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Experience</h3>
          <Button size="sm" variant="secondary" onClick={() => addArrayItem('experience', { title: '', company: '', duration: '', description: '' })}>
            <Plus size={13} /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {resume.experience.map((exp, i) => (
            <div key={i} className="rounded-xl border border-paper-line p-4 dark:border-ink-line">
              <div className="mb-2 flex justify-end">
                <button onClick={() => removeArrayItem('experience', i)} className="text-ink/40 hover:text-danger" aria-label="Remove experience"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="Job title" value={exp.title} onChange={(e) => updateArrayItem('experience', i, 'title', e.target.value)} />
                <Input placeholder="Company" value={exp.company} onChange={(e) => updateArrayItem('experience', i, 'company', e.target.value)} />
              </div>
              <Input className="mt-3" placeholder="Duration (e.g. Jan 2022 - Present)" value={exp.duration} onChange={(e) => updateArrayItem('experience', i, 'duration', e.target.value)} />
              <Input className="mt-3" textarea rows={3} placeholder="Description / bullet points" value={exp.description} onChange={(e) => updateArrayItem('experience', i, 'description', e.target.value)} />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => handleImproveBullet('experience', i)} loading={improvingIndex === `experience-${i}`}>
                  <Sparkles size={12} /> Improve with AI
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Projects */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Projects</h3>
          <Button size="sm" variant="secondary" onClick={() => addArrayItem('projects', { name: '', description: '', technologies: [] })}>
            <Plus size={13} /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {resume.projects.map((proj, i) => (
            <div key={i} className="rounded-xl border border-paper-line p-4 dark:border-ink-line">
              <div className="mb-2 flex justify-end">
                <button onClick={() => removeArrayItem('projects', i)} className="text-ink/40 hover:text-danger" aria-label="Remove project"><Trash2 size={14} /></button>
              </div>
              <Input placeholder="Project name" value={proj.name} onChange={(e) => updateArrayItem('projects', i, 'name', e.target.value)} />
              <Input
                className="mt-3"
                placeholder="Technologies (comma-separated)"
                value={proj.technologies.join(', ')}
                onChange={(e) => updateArrayItem('projects', i, 'technologies', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
              />
              <Input className="mt-3" textarea rows={3} placeholder="Description" value={proj.description} onChange={(e) => updateArrayItem('projects', i, 'description', e.target.value)} />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => handleImproveBullet('projects', i)} loading={improvingIndex === `projects-${i}`}>
                  <Sparkles size={12} /> Improve with AI
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold">Education</h3>
          <Button size="sm" variant="secondary" onClick={() => addArrayItem('education', { institution: '', degree: '', field: '', year: '' })}>
            <Plus size={13} /> Add
          </Button>
        </div>
        <div className="space-y-4">
          {resume.education.map((edu, i) => (
            <div key={i} className="rounded-xl border border-paper-line p-4 dark:border-ink-line">
              <div className="mb-2 flex justify-end">
                <button onClick={() => removeArrayItem('education', i)} className="text-ink/40 hover:text-danger" aria-label="Remove education"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input placeholder="Degree (e.g. B.Tech)" value={edu.degree} onChange={(e) => updateArrayItem('education', i, 'degree', e.target.value)} />
                <Input placeholder="Field of study" value={edu.field} onChange={(e) => updateArrayItem('education', i, 'field', e.target.value)} />
                <Input placeholder="Institution" value={edu.institution} onChange={(e) => updateArrayItem('education', i, 'institution', e.target.value)} />
                <Input placeholder="Year" value={edu.year} onChange={(e) => updateArrayItem('education', i, 'year', e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Certifications & Achievements */}
      <Card className="p-5">
        <h3 className="mb-3 font-display text-sm font-semibold">Certifications</h3>
        <ChipList items={resume.certifications} onChange={(certifications) => setResume((r) => ({ ...r, certifications }))} placeholder="Add a certification and press Enter" />
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 font-display text-sm font-semibold">Achievements</h3>
        <ChipList items={resume.achievements} onChange={(achievements) => setResume((r) => ({ ...r, achievements }))} placeholder="Add an achievement and press Enter" />
      </Card>

      {/* Keyword optimizer */}
      <Card className="p-5">
        <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold">
          <Sparkles size={15} className="text-primary" /> Tailor to a job
        </h3>
        <p className="mb-3 text-xs text-ink/50 dark:text-paper/50">
          Paste a job description to get rephrasing suggestions based on your existing content - never adds skills you don't have.
        </p>
        <Input textarea rows={4} placeholder="Paste job description..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={handleOptimizeKeywords} loading={optimizing}>Get suggestions</Button>
        </div>
        {keywordSuggestions && (
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-paper-line/40 p-4 text-sm dark:bg-ink-line/40">
            {keywordSuggestions}
          </div>
        )}
      </Card>

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="secondary" onClick={handleSave} loading={saving}><Save size={15} /> Save draft</Button>
        <Button onClick={handleExport} loading={exporting}><Download size={15} /> Export PDF</Button>
      </div>
    </div>
  );
}
