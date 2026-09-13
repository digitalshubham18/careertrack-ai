import React from 'react';
import clsx from 'clsx';

export default function Card({ children, className, as: Component = 'div', ...props }) {
  return (
    <Component
      className={clsx(
        'rounded-2xl border border-paper-line bg-paper-soft dark:border-ink-line dark:bg-ink-soft',
        'shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
