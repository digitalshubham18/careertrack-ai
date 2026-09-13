import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Select = forwardRef(({ label, error, className, children, ...props }, ref) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-paper/80">{label}</span>}
    <select
      ref={ref}
      className={clsx(
        'w-full rounded-xl border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink outline-none transition-colors',
        'focus:border-primary dark:border-ink-line dark:bg-ink-soft dark:text-paper',
        error && 'border-danger focus:border-danger',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
  </label>
));
Select.displayName = 'Select';
export default Select;
