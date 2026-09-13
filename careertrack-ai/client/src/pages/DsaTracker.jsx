import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Flame, Target, Plus, Trash2, Sparkles, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { dsaService } from '../services/dsa.service';
import { DSA_TOPICS } from '../utils/dsaTopics';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import EmptyState from '../components/EmptyState';
import { timeAgo } from '../utils/format';

const DIFFICULTY_COLORS = { Easy: '#14B8A6', Medium: '#F59E0B', Hard: '#E11D48' };

export default function DsaTracker() {
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ topic: 'Arrays', difficulty: 'Easy', title: '' });
  const [goalInput, setGoalInput] = useState(3);
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, entriesRes] = await Promise.all([
        dsaService.getSummary(),
        dsaService.listEntries({ limit: 10 }),
      ]);
      setSummary(summaryRes.data.data.summary);
      setGoalInput(summaryRes.data.data.summary.dailyGoal);
      setEntries(entriesRes.data.data.entries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Enter a problem title');
    setSubmitting(true);
    try {
      await dsaService.logEntry(form);
      toast.success('Problem logged!');
      setForm((f) => ({ ...f, title: '' }));
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log problem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await dsaService.deleteEntry(id);
    toast.success('Entry deleted');
    fetchAll();
  };

  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      await dsaService.updateGoal(Number(goalInput));
      toast.success('Daily goal updated');
      fetchAll();
    } catch {
      toast.error('Failed to update goal');
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading || !summary) {
    return (
      <div className="grid place-items-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const topicChartData = summary.topics.map((topic) => ({ topic, count: summary.byTopic[topic] || 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">DSA Tracker</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">Track your data structures & algorithms practice.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Code2} label="Total Solved" value={summary.total} accent="primary" />
        <StatCard icon={Flame} label="Current Streak" value={summary.streak} suffix="days" accent="warn" />
        <StatCard icon={Target} label="This Week" value={summary.solvedThisWeek} accent="accent" />
        <StatCard icon={Sparkles} label="Today" value={`${summary.solvedToday}/${summary.dailyGoal}`} accent="accent" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold">Log a solved problem</h3>
            <form onSubmit={handleLog} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Input placeholder="Problem title (e.g. Two Sum)" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <Select value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}>
                {DSA_TOPICS.map((t) => <option key={t}>{t}</option>)}
              </Select>
              <Select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}>
                {['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
              </Select>
              <div className="sm:col-span-4">
                <Button type="submit" loading={submitting} className="w-full sm:w-auto">
                  <Plus size={15} /> Log problem
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold">Problems by topic</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topicChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
                <XAxis dataKey="topic" tick={{ fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F3CC9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 font-display text-sm font-semibold">Recent activity</h3>
            {entries.length === 0 ? (
              <EmptyState icon={Code2} title="No problems logged yet" description="Log your first solved problem above to start tracking." />
            ) : (
              <div className="divide-y divide-paper-line dark:divide-ink-line">
                {entries.map((entry) => (
                  <div key={entry._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="text-xs text-ink/50 dark:text-paper/50">
                        {entry.topic} · <span style={{ color: DIFFICULTY_COLORS[entry.difficulty] }}>{entry.difficulty}</span> · {timeAgo(entry.solvedAt)}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(entry._id)} className="rounded-lg p-1.5 text-ink/40 hover:bg-danger/10 hover:text-danger" aria-label="Delete entry">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold">Difficulty breakdown</h3>
            {['Easy', 'Medium', 'Hard'].map((diff) => (
              <div key={diff} className="mb-3 last:mb-0">
                <div className="mb-1 flex justify-between text-xs font-medium text-ink/60 dark:text-paper/60">
                  <span>{diff}</span>
                  <span className="font-data">{summary.byDifficulty[diff] || 0}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${summary.total ? ((summary.byDifficulty[diff] || 0) / summary.total) * 100 : 0}%`,
                      backgroundColor: DIFFICULTY_COLORS[diff],
                    }}
                  />
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-display text-sm font-semibold">Daily goal</h3>
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
              <div className="h-full rounded-full bg-accent" style={{ width: `${summary.dailyGoalProgress}%` }} />
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min="1" max="50" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} />
              <Button size="sm" onClick={handleSaveGoal} loading={savingGoal}>Save</Button>
            </div>
          </Card>

          {summary.recommendations?.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                <Sparkles size={15} className="text-primary" /> Recommendations
              </h3>
              <ul className="space-y-2 text-sm text-ink/70 dark:text-paper/70">
                {summary.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
