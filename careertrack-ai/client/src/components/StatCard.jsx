import React from 'react';
import Card from './Card';

export default function StatCard({ icon: Icon, label, value, accent = 'primary', suffix }) {
  const accentClasses = {
    primary: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
    accent: 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
  };

  return (
    <Card className="animate-rise p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">
            {label}
          </p>
          <p className="mt-2 font-data text-2xl font-semibold">
            {value}
            {suffix && <span className="ml-1 text-sm font-normal text-ink/50 dark:text-paper/50">{suffix}</span>}
          </p>
        </div>
        {Icon && (
          <div className={`rounded-xl p-2.5 ${accentClasses[accent]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}
