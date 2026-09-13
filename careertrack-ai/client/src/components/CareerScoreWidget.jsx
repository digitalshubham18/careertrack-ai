import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import Card from './Card';
import ScoreDial from './ScoreDial';
import { careerScoreService } from '../services/careerScore.service';

const CATEGORY_LABELS = {
  resume: 'Resume',
  dsa: 'DSA',
  skills: 'Skills',
  projects: 'Projects',
  applications: 'Applications',
  interviews: 'Interviews',
};

export default function CareerScoreWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await careerScoreService.get();
        setData(res.data.data);
      } catch {
        // non-critical widget - fail silently
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-40 animate-pulse rounded-xl bg-paper-line dark:bg-ink-line" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ScoreDial score={data.overall} size={140} label="CareerTrack Score" />

        <div className="flex-1 space-y-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs font-medium text-ink/60 dark:text-paper/60">
                <span>{label}</span>
                <span className="font-data">{data.categories[key]}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
                <div className="h-full rounded-full bg-primary" style={{ width: `${data.categories[key]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.recommendations?.length > 0 && (
        <div className="mt-5 border-t border-paper-line pt-4 dark:border-ink-line">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-paper/50">
            <Sparkles size={12} className="text-primary" /> Recommendations
          </h4>
          <ul className="space-y-1.5 text-sm text-ink/70 dark:text-paper/70">
            {data.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}
