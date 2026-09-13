import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from 'recharts';
import { analyticsService } from '../services/analytics.service';
import Card from '../components/Card';
import { CardSkeleton } from '../components/Skeleton';

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await analyticsService.dashboard();
      setData(res.data.data);
    })();
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const { summary, charts } = data;
  const metrics = [
    { label: 'Interview rate', value: `${summary.interviewRate}%`, description: 'Interviews ÷ applied' },
    { label: 'Offer rate', value: `${summary.offerRate}%`, description: 'Offers ÷ applied' },
    { label: 'Response rate', value: `${summary.responseRate}%`, description: 'Any response ÷ applied' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-ink/60 dark:text-paper/60">Deep dive into your job search performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">{m.label}</p>
            <p className="mt-2 font-data text-3xl font-semibold text-primary">{m.value}</p>
            <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">{m.description}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="mb-4 font-display text-sm font-semibold">Applications over time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={charts.overTime}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#4F3CC9" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-semibold">Interview conversion by status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.byStatus} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis dataKey="status" type="category" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#14B8A6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-display text-sm font-semibold">Top companies applied to</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.byCompany}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-paper-line dark:stroke-ink-line" />
              <XAxis dataKey="company" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#4F3CC9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
