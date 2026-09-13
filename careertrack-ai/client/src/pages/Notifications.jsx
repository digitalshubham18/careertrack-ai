import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { timeAgo } from '../utils/format';

const TYPE_ICON_STYLE = {
  interview_reminder: 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  deadline_reminder: 'bg-warn/10 text-warn',
  followup_reminder: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
  status_update: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
  resume_analysis_complete: 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  new_job: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
  high_match_job: 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  system: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Deadline reminders, status updates, and analysis results will show up here." />
      ) : (
        <Card className="divide-y divide-paper-line dark:divide-ink-line">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start gap-3 p-4 ${!n.isRead ? 'bg-primary/5' : ''}`}
            >
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TYPE_ICON_STYLE[n.type] || TYPE_ICON_STYLE.system}`}>
                <Bell size={15} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                {n.relatedJobListing ? (
                  <Link to={`/jobs/${n.relatedJobListing}`} className="text-sm text-primary hover:underline">
                    {n.message}
                  </Link>
                ) : (
                  <p className="text-sm text-ink/60 dark:text-paper/60">{n.message}</p>
                )}
                <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => markRead(n._id)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
