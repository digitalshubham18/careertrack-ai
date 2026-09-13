import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Target, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeService } from '../services/resume.service';
import { atsService } from '../services/ats.service';
import { jobService } from '../services/job.service';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import ScoreDial from '../components/ScoreDial';
import EmptyState from '../components/EmptyState';

const CATEGORY_LABELS = {
  keywordMatch: 'Keyword Match',
  skillsMatch: 'Skills Match',
  experienceMatch: 'Experience Match',
  educationMatch: 'Education Match',
  formatting: 'Formatting',
};

export default function AtsAnalyzer() {
  const location = useLocation();
  const [resumes, setResumes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [resumeId, setResumeId] = useState('');
  const [jobApplicationId, setJobApplicationId] = useState(location.state?.jobApplicationId || '');
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const [resumeRes, jobsRes] = await Promise.all([resumeService.list(), jobService.list({ limit: 100 })]);
      const parsedResumes = resumeRes.data.data.resumes.filter((r) => r.parseStatus === 'parsed');
      setResumes(parsedResumes);
      setApplications(jobsRes.data.data.applications);

      const primary = parsedResumes.find((r) => r.isPrimary) || parsedResumes[0];
      if (primary) setResumeId(primary._id);

      if (location.state?.jobApplicationId) {
        const app = jobsRes.data.data.applications.find((a) => a._id === location.state.jobApplicationId);
        if (app?.jobDescription) setJobDescription(app.jobDescription);
      }
    })();
  }, [location.state]);

  const handleAnalyze = async () => {
    if (!resumeId) return toast.error('Select a resume first');
    if (jobDescription.trim().length < 20) return toast.error('Paste a longer job description (at least 20 characters)');

    setAnalyzing(true);
    setResult(null);
    try {
      const res = await atsService.analyze({
        resumeId,
        jobDescription,
        jobApplicationId: jobApplicationId || undefined,
      });
      setResult(res.data.data.analysis);
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">ATS Analyzer</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Get a transparent, category-by-category ATS score for your resume against any job description.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-semibold">1. Choose your resume</h3>
          {resumes.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No parsed resumes available"
              description="Upload a resume in the Resume Manager and wait for parsing to finish."
            />
          ) : (
            <Select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.originalFilename} {r.isPrimary ? '(Primary)' : ''}
                </option>
              ))}
            </Select>
          )}

          <h3 className="mb-2 mt-6 font-display text-sm font-semibold">2. Link to an application (optional)</h3>
          <Select value={jobApplicationId} onChange={(e) => setJobApplicationId(e.target.value)}>
            <option value="">Don't link to an application</option>
            {applications.map((a) => (
              <option key={a._id} value={a._id}>{a.jobTitle} at {a.companyName}</option>
            ))}
          </Select>

          <h3 className="mb-2 mt-6 font-display text-sm font-semibold">3. Paste the job description</h3>
          <Input
            textarea
            rows={10}
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <Button className="mt-5 w-full" onClick={handleAnalyze} loading={analyzing}>
            <Target size={16} /> Analyze Resume
          </Button>
        </Card>

        <div>
          {analyzing && (
            <Card className="grid h-full min-h-[300px] place-items-center p-5">
              <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm text-ink/60 dark:text-paper/60">Running the scoring pipeline...</p>
              </div>
            </Card>
          )}

          {!analyzing && !result && (
            <Card className="grid h-full min-h-[300px] place-items-center p-5">
              <EmptyState
                icon={Target}
                title="No analysis yet"
                description="Choose a resume and paste a job description, then click Analyze Resume."
              />
            </Card>
          )}

          {!analyzing && result && (
            <div className="space-y-5">
              <Card className="flex flex-col items-center p-6">
                <ScoreDial score={result.scores.overall} size={140} label="Overall ATS Score" />
                <div className="mt-6 w-full space-y-3">
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-xs font-medium text-ink/60 dark:text-paper/60">
                        <span>{label}</span>
                        <span className="font-data">{result.scores[key]}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${result.scores[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <CheckCircle2 size={16} className="text-accent" /> Matched Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedSkills.length ? result.matchedSkills.map((s) => (
                    <span key={s} className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-dark dark:bg-accent/20 dark:text-accent-light">{s}</span>
                  )) : <span className="text-sm text-ink/50 dark:text-paper/50">No skill matches found.</span>}
                </div>

                <h3 className="mb-3 mt-5 flex items-center gap-2 font-display text-sm font-semibold">
                  <XCircle size={16} className="text-danger" /> Missing Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.length ? result.missingSkills.map((s) => (
                    <span key={s} className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">{s}</span>
                  )) : <span className="text-sm text-ink/50 dark:text-paper/50">No missing skills — great match!</span>}
                </div>

                <h3 className="mb-3 mt-5 font-display text-sm font-semibold">Matching Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.slice(0, 15).map((k) => (
                    <span key={k} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/20 dark:text-primary-light">{k}</span>
                  ))}
                </div>

                <h3 className="mb-3 mt-5 font-display text-sm font-semibold">Missing Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.slice(0, 15).map((k) => (
                    <span key={k} className="rounded-full bg-paper-line px-2.5 py-1 text-xs font-medium dark:bg-ink-line">{k}</span>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                  <Sparkles size={16} className="text-primary" /> Recommendations
                </h3>
                <ol className="list-inside list-decimal space-y-2 text-sm text-ink/70 dark:text-paper/70">
                  {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ol>
                {result.aiSummary && (
                  <p className="mt-4 border-t border-paper-line pt-4 text-sm text-ink/60 dark:border-ink-line dark:text-paper/60">
                    {result.aiSummary}
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
