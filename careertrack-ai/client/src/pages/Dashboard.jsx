import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { Briefcase, MessageSquareText, Award, TrendingUp, ArrowRight } from 'lucide-react';
import { analyticsService } from '../services/analytics.service';
import { jobListingService } from '../services/jobListing.service';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import JobCard from '../components/JobCard';
import CareerScoreWidget from '../components/CareerScoreWidget';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

const STATUS_PIE_COLORS = ['#4F3CC9', '#7C6AE0', '#14B8A6', '#F59E0B', '#E11D48', '#94A3B8', '#0F8F80', '#5EEAD4', '#64748B'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await analyticsService.dashboard();
        setData(res.data.data);
      } finally {
        setLoading(false);
      }
    })();
    (async () => {
      try {
        const res = await jobListingService.getRecommended();
        setRecommendedJobs(res.data.data.jobs.slice(0, 3));
      } catch {
        // non-critical widget - fail silently
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const { summary, charts } = data;
  const hasApplications = summary.total > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">Here's how your job search is going.</p>
      </div>

      <CareerScoreWidget />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Briefcase} label="Total Applications" value={summary.total} accent="primary" />
        <StatCard icon={MessageSquareText} label="Interviews" value={summary.interviews} accent="accent" />
        <StatCard icon={Award} label="Offers" value={summary.offers} accent="accent" />
        <StatCard icon={TrendingUp} label="Interview Rate" value={summary.interviewRate} suffix="%" accent="warn" />
      </div>

      {recommendedJobs.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">🔥 Recommended for you</h2>
            <Link to="/jobs" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {recommendedJobs.map((job) => (
              <JobCard key={job._id} job={job} matchScore={job.matchScore} />
            ))}
          </div>
        </div>
      )}

      {!hasApplications ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Add your first job application to start seeing analytics here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">This week</p>
              <p className="mt-2 font-data text-2xl font-semibold">{summary.thisWeek}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">This month</p>
              <p className="mt-2 font-data text-2xl font-semibold">{summary.thisMonth}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">Offer rate</p>
              <p className="mt-2 font-data text-2xl font-semibold">{summary.offerRate}%</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 font-display text-sm font-semibold">Applications over time</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.overTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#4F3CC9" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-display text-sm font-semibold">Applications by status</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={charts.byStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80}>
                    {charts.byStatus.map((entry, i) => (
                      <Cell key={entry.status} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-display text-sm font-semibold">Applications by company</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.byCompany}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
                  <XAxis dataKey="company" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F3CC9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4 font-display text-sm font-semibold">Applications by location</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.byLocation}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
                  <XAxis dataKey="location" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14B8A6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
