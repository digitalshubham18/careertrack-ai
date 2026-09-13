import React from 'react';
import clsx from 'clsx';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark disabled:opacity-50',
  secondary:
    'bg-paper-soft border border-paper-line text-ink hover:bg-paper dark:bg-ink-soft dark:border-ink-line dark:text-paper dark:hover:bg-ink',
  danger: 'bg-danger text-white hover:bg-danger/90 disabled:opacity-50',
  ghost: 'text-ink/70 hover:bg-paper-line/50 dark:text-paper/70 dark:hover:bg-ink-line/50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
};

export default function Button({
  children, variant = 'primary', size = 'md', className, loading, disabled, ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
