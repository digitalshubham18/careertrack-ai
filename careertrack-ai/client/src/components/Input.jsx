import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({ label, error, className, textarea, rows = 4, ...props }, ref) => {
  const Component = textarea ? 'textarea' : 'input';
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-paper/80">{label}</span>}
      <Component
        ref={ref}
        rows={textarea ? rows : undefined}
        className={clsx(
          'w-full rounded-xl border border-paper-line bg-paper-soft px-3.5 py-2.5 text-sm text-ink outline-none transition-colors',
          'placeholder:text-ink/40 focus:border-primary',
          'dark:border-ink-line dark:bg-ink-soft dark:text-paper dark:placeholder:text-paper/40',
          error && 'border-danger focus:border-danger',
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
});
Input.displayName = 'Input';
export default Input;
