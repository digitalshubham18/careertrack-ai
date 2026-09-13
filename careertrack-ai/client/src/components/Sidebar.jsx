import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, Briefcase, FileText, Target, MessageSquareText, Code2, Building2, BarChart3,
  Bell, User, ShieldCheck, Rss, ListChecks, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/jobs', label: 'Discover Jobs', icon: Search },
  { to: '/applications', label: 'Applications', icon: Briefcase },
  { to: '/resumes', label: 'Resume Manager', icon: FileText },
  { to: '/ats-analyzer', label: 'ATS Analyzer', icon: Target },
  { to: '/interview-prep', label: 'Interview Prep', icon: MessageSquareText },
  { to: '/dsa-tracker', label: 'DSA Tracker', icon: Code2 },
  { to: '/companies', label: 'Company Tracker', icon: Building2 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck },
  { to: '/admin/job-sources', label: 'Job Sources', icon: Rss },
  { to: '/admin/job-listings', label: 'Manage Job Listings', icon: ListChecks },
];

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-paper-line bg-paper-soft transition-transform dark:border-ink-line dark:bg-ink-soft lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-white">
              CT
            </div>
            <span className="font-display text-base font-semibold">CareerTrack</span>
          </a>
          <button className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-2 flex flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                    : 'text-ink/70 hover:bg-paper-line/50 dark:text-paper/70 dark:hover:bg-ink-line/50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-2 h-px bg-paper-line dark:bg-ink-line" />
              {adminNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                        : 'text-ink/70 hover:bg-paper-line/50 dark:text-paper/70 dark:hover:bg-ink-line/50'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
