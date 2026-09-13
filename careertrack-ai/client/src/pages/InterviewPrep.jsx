import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquareText, Sparkles, Send, PlayCircle, ArrowRight, ListChecks,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobService } from '../services/job.service';
import Card from '../components/Card';
import Button from '../components/Button';
import Select from '../components/Select';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';

const CATEGORY_STYLES = {
  Technical: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
  Behavioral: 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  'Company/Role': 'bg-warn/10 text-warn',
};

const EVAL_DIMENSIONS = ['technicalAccuracy', 'communication', 'relevance', 'completeness', 'confidence', 'structure'];
const DIMENSION_LABELS = {
  technicalAccuracy: 'Technical Accuracy',
  communication: 'Communication',
  relevance: 'Relevance',
  completeness: 'Completeness',
  confidence: 'Confidence',
  structure: 'Structure',
};

function QuestionCard({ q, answer, onAnswerChange, onSubmit, submitting }) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_STYLES[q.category]}`}>
          {q.category}
        </span>
        {q.topic && <span className="text-xs text-ink/50 dark:text-paper/50">{q.topic}</span>}
      </div>
      <p className="font-medium">{q.question}</p>

      <Input
        textarea
        rows={3}
        className="mt-3"
        placeholder="Type your answer..."
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={q.evaluation?.score != null}
      />
      {q.evaluation?.score == null && (
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={onSubmit} loading={submitting}>
            <Send size={13} /> Submit answer
          </Button>
        </div>
      )}

      {q.evaluation?.score != null && (
        <div className="mt-4 rounded-xl bg-paper-line/40 p-4 dark:bg-ink-line/40">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Practice feedback</p>
            <p className="font-data text-sm font-semibold text-primary">{q.evaluation.score}/10</p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink/60 dark:text-paper/60 sm:grid-cols-3">
            {EVAL_DIMENSIONS.map((dim) => (
              <span key={dim}>{DIMENSION_LABELS[dim]}: {q.evaluation[dim]}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{q.evaluation.feedback}</p>
          {q.evaluation.improvedAnswer && (
            <div className="mt-2 border-t border-paper-line pt-2 dark:border-ink-line">
              <p className="text-xs font-medium text-ink/50 dark:text-paper/50">Suggested improved answer</p>
              <p className="mt-1 text-sm italic text-ink/70 dark:text-paper/70">{q.evaluation.improvedAnswer}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function MockInterviewFlow({ interview, selectedApp, onInterviewUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = interview.questions.findIndex((q) => q.evaluation?.score == null);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = interview.questions.length;
  const currentQuestion = interview.questions[currentIndex];
  const allAnswered = interview.questions.every((q) => q.evaluation?.score != null);
  const answeredCount = interview.questions.filter((q) => q.evaluation?.score != null).length;

  const handleSubmit = async () => {
    if (!answer.trim()) return toast.error('Write an answer before submitting');
    setSubmitting(true);
    try {
      const res = await jobService.submitAnswer(selectedApp, { questionId: currentQuestion._id, answer });
      onInterviewUpdate(res.data.data.interview);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setAnswer('');
    setCurrentIndex((i) => Math.min(i + 1, total - 1));
  };

  if (allAnswered) {
    const averages = {};
    for (const dim of EVAL_DIMENSIONS) {
      averages[dim] = (
        interview.questions.reduce((sum, q) => sum + (q.evaluation?.[dim] || 0), 0) / total
      ).toFixed(1);
    }

    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">
            Mock Interview Complete — Overall Score
          </p>
          <p className="mt-2 font-data text-4xl font-bold text-primary">{interview.averageScore?.toFixed(1)}/10</p>
          <p className="mx-auto mt-2 max-w-sm text-xs text-ink/50 dark:text-paper/50">
            This is practice feedback to help you improve, not an actual hiring decision.
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-display text-sm font-semibold">Performance breakdown</h3>
          <div className="space-y-3">
            {EVAL_DIMENSIONS.map((dim) => (
              <div key={dim}>
                <div className="mb-1 flex justify-between text-xs font-medium text-ink/60 dark:text-paper/60">
                  <span>{DIMENSION_LABELS[dim]}</span>
                  <span className="font-data">{averages[dim]}/10</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(averages[dim] / 10) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold">Review your answers</h3>
          {interview.questions.map((q) => (
            <QuestionCard key={q._id} q={q} answer={q.userAnswer} onAnswerChange={() => {}} onSubmit={() => {}} submitting={false} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink/60 dark:text-paper/60">
          <span>Question {currentIndex + 1} of {total}</span>
          <span>{answeredCount}/{total} answered</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / total) * 100}%` }} />
        </div>
      </Card>

      <QuestionCard
        q={currentQuestion}
        answer={currentQuestion.evaluation?.score != null ? currentQuestion.userAnswer : answer}
        onAnswerChange={setAnswer}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {currentQuestion.evaluation?.score != null && currentIndex < total - 1 && (
        <div className="flex justify-end">
          <Button onClick={handleNext}>
            Next question <ArrowRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function InterviewPrep() {
  const location = useLocation();
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(location.state?.jobApplicationId || '');
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState('review'); // 'review' | 'mock'
  const [answers, setAnswers] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await jobService.list({ limit: 100 });
      setApplications(res.data.data.applications);
    })();
  }, []);

  const fetchInterview = useCallback(async (appId) => {
    if (!appId) return;
    setLoading(true);
    try {
      const res = await jobService.getInterview(appId);
      setInterview(res.data.data.interview);
    } catch {
      setInterview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedApp) fetchInterview(selectedApp); }, [selectedApp, fetchInterview]);

  const handleGenerate = async () => {
    if (!selectedApp) return toast.error('Select an application first');
    setGenerating(true);
    try {
      const res = await jobService.generateInterview(selectedApp);
      setInterview(res.data.data.interview);
      setMode('review');
      toast.success('Interview questions generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    const answer = answers[questionId];
    if (!answer?.trim()) return toast.error('Write an answer before submitting');

    setSubmittingId(questionId);
    try {
      const res = await jobService.submitAnswer(selectedApp, { questionId, answer });
      setInterview(res.data.data.interview);
      toast.success('Answer evaluated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation failed');
    } finally {
      setSubmittingId(null);
    }
  };

  const selectedAppData = applications.find((a) => a._id === selectedApp);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Interview Preparation</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">
          Practice with AI-generated questions grounded in the job description and field.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <Select label="Select an application" value={selectedApp} onChange={(e) => { setSelectedApp(e.target.value); setMode('review'); }}>
              <option value="">Choose an application...</option>
              {applications.map((a) => (
                <option key={a._id} value={a._id}>{a.jobTitle} at {a.companyName}</option>
              ))}
            </Select>
          </div>
          <Button onClick={handleGenerate} loading={generating} disabled={!selectedApp}>
            <Sparkles size={16} /> {interview ? 'Regenerate questions' : 'Generate questions'}
          </Button>
        </div>
      </Card>

      {!selectedApp && (
        <EmptyState
          icon={MessageSquareText}
          title="Select an application to begin"
          description="Choose a job application above, then generate technical, behavioral, and role-specific interview questions."
        />
      )}

      {selectedApp && loading && (
        <div className="grid place-items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {selectedApp && !loading && !interview && (
        <EmptyState
          icon={MessageSquareText}
          title="No interview prep yet"
          description={`Click "Generate questions" to create a prep set for ${selectedAppData?.jobTitle || 'this role'}.`}
        />
      )}

      {interview && (
        <>
          <div className="flex items-center justify-between">
            {interview.averageScore != null && mode === 'review' && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink/50 dark:text-paper/50">Average score (practice only):</span>
                <span className="font-data font-semibold text-primary">{interview.averageScore.toFixed(1)}/10</span>
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant={mode === 'review' ? 'primary' : 'secondary'}
                onClick={() => setMode('review')}
              >
                <ListChecks size={14} /> Review Mode
              </Button>
              <Button
                size="sm"
                variant={mode === 'mock' ? 'primary' : 'secondary'}
                onClick={() => setMode('mock')}
              >
                <PlayCircle size={14} /> Start Mock Interview
              </Button>
            </div>
          </div>

          {mode === 'mock' ? (
            <MockInterviewFlow interview={interview} selectedApp={selectedApp} onInterviewUpdate={setInterview} />
          ) : (
            <div className="space-y-4">
              {interview.questions.map((q) => (
                <QuestionCard
                  key={q._id}
                  q={q}
                  answer={answers[q._id] ?? q.userAnswer ?? ''}
                  onAnswerChange={(val) => setAnswers((prev) => ({ ...prev, [q._id]: val }))}
                  onSubmit={() => handleSubmitAnswer(q._id)}
                  submitting={submittingId === q._id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
