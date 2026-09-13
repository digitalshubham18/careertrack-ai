import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KANBAN_COLUMNS } from '../utils/constants';
import { PriorityBadge } from './StatusBadge';

export default function KanbanBoard({ applications, onStatusChange }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const columns = KANBAN_COLUMNS.map((status) => ({
    status,
    items: applications.filter((app) => app.status === status),
  }));

  const handleDrop = (status) => {
    if (draggingId) onStatusChange(draggingId, status);
    setDraggingId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((col) => (
        <div
          key={col.status}
          onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.status); }}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={() => handleDrop(col.status)}
          className={`w-72 shrink-0 rounded-2xl border p-3 transition-colors ${
            dragOverColumn === col.status
              ? 'border-primary bg-primary/5'
              : 'border-paper-line bg-paper-soft dark:border-ink-line dark:bg-ink-soft'
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold">{col.status}</h3>
            <span className="rounded-full bg-paper-line px-2 py-0.5 text-xs font-medium text-ink/60 dark:bg-ink-line dark:text-paper/60">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-2">
            {col.items.map((app) => (
              <Link
                key={app._id}
                to={`/applications/${app._id}`}
                draggable
                onDragStart={() => setDraggingId(app._id)}
                onDragEnd={() => setDraggingId(null)}
                className={`block cursor-grab rounded-xl border border-paper-line bg-paper p-3 shadow-sm transition-opacity active:cursor-grabbing dark:border-ink-line dark:bg-ink ${
                  draggingId === app._id ? 'opacity-40' : ''
                }`}
              >
                <p className="text-sm font-semibold">{app.jobTitle}</p>
                <p className="text-xs text-ink/60 dark:text-paper/60">{app.companyName}</p>
                <div className="mt-2 flex items-center justify-between">
                  <PriorityBadge priority={app.priority} />
                  {app.atsScore != null && (
                    <span className="font-data text-xs font-semibold text-primary">{app.atsScore}/100</span>
                  )}
                </div>
              </Link>
            ))}
            {col.items.length === 0 && (
              <div className="rounded-xl border border-dashed border-paper-line py-6 text-center text-xs text-ink/40 dark:border-ink-line dark:text-paper/40">
                Drop here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
