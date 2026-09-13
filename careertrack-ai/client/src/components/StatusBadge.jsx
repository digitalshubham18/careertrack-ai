import React from 'react';
import clsx from 'clsx';
import { STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';

export function StatusBadge({ status }) {
  return (
    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_COLORS[status])}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={clsx('rounded-full px-2.5 py-1 text-xs font-semibold', PRIORITY_COLORS[priority])}>
      {priority}
    </span>
  );
}
