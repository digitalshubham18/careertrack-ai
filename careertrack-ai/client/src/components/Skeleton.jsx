import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded-lg bg-paper-line dark:bg-ink-line', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-paper-line bg-paper-soft p-5 dark:border-ink-line dark:bg-ink-soft">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
    </div>
  );
}
