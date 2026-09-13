import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-paper-line px-6 py-14 text-center dark:border-ink-line">
      {Icon && (
        <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary dark:bg-primary/20 dark:text-primary-light">
          <Icon size={24} />
        </div>
      )}
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink/60 dark:text-paper/60">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
