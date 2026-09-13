export const STATUSES = [
  'Saved', 'Applied', 'Shortlisted', 'OA', 'Interview', 'Technical Interview',
  'HR Interview', 'Final Round', 'Offer', 'Rejected', 'Withdrawn',
];

export const KANBAN_COLUMNS = ['Saved', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'];

export const STATUS_COLORS = {
  Saved: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Applied: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light',
  Shortlisted: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  OA: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Interview: 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  'Technical Interview': 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  'HR Interview': 'bg-accent/10 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  'Final Round': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  Offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  Withdrawn: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export const PRIORITY_COLORS = {
  Low: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  High: 'bg-danger/10 text-danger dark:bg-danger/20',
};

export const JOB_CATEGORIES = [
  'Frontend', 'Backend', 'Full Stack', 'SDE', 'AI/ML', 'Data Science',
  'DevOps', 'Cloud', 'Cybersecurity', 'Mobile', 'QA', 'Product', 'Internship', 'Other',
];
