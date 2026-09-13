import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target, FileText, MessageSquareText, BarChart3, ArrowRight, Check, Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Transparent ATS scoring',
    description:
      'A real scoring pipeline — not a guess. Keyword match, skills match, experience, education, and formatting, each broken out and explained.',
  },
  {
    icon: FileText,
    title: 'Resume intelligence',
    description:
      'Upload PDF or DOCX resumes and get structured skills, experience, and education extraction, plus grounded improvement suggestions.',
  },
  {
    icon: MessageSquareText,
    title: 'Interview preparation',
    description:
      'AI-generated technical, behavioral, and role-specific questions, with practice answer evaluation and constructive feedback.',
  },
  {
    icon: BarChart3,
    title: 'Job search analytics',
    description:
      'See your interview rate, offer rate, and response rate at a glance, with a Kanban board to manage every stage.',
  },
];

const steps = [
  { title: 'Upload your resume', description: 'PDF or DOCX. We parse skills, experience, and education automatically.' },
  { title: 'Paste a job description', description: 'Get a transparent ATS score with matched and missing skills.' },
  { title: 'Track every application', description: 'Kanban board, deadlines, follow-ups, and interview prep in one place.' },
];

const faqs = [
  {
    q: 'Does CareerTrack AI invent skills or experience I don\'t have?',
    a: 'No. Every recommendation is grounded in your actual resume content — the AI is instructed to never fabricate experience, and scoring is based on deterministic overlap with the job description first.',
  },
  {
    q: 'What resume formats are supported?',
    a: 'PDF and DOCX. Files are validated by both MIME type and extension before processing.',
  },
  {
    q: 'Is the interview evaluation a real hiring decision?',
    a: 'No — it\'s practice feedback to help you improve your answers before a real interview.',
  },
];

export default function Landing() {
  return (
    <div className="bg-paper text-ink dark:bg-ink dark:text-paper">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-white">
            CT
          </div>
          <span className="font-display text-base font-semibold">CareerTrack AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-ink dark:text-paper/70 dark:hover:text-paper">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-trajectory" />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center">
          <span className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-paper-line bg-paper-soft px-3 py-1 text-xs font-medium text-ink/60 dark:border-ink-line dark:bg-ink-soft dark:text-paper/60">
            <Sparkles size={12} className="text-accent" /> AI-powered job search platform
          </span>
          <h1 className="font-display text-5xl font-bold leading-tight sm:text-6xl">
            Track Every Application.
            <br />
            <span className="text-primary">Land Your Next Job.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink/60 dark:text-paper/60">
            AI-powered job tracking, ATS analysis, resume optimization, and interview
            preparation — all in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Start tracking for free <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="rounded-xl border border-paper-line px-6 py-3 text-sm font-semibold hover:bg-paper-soft dark:border-ink-line dark:hover:bg-ink-soft"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="mx-auto max-w-5xl px-6 pb-8">
        <div className="rounded-2xl border border-paper-line bg-paper-soft p-3 shadow-xl dark:border-ink-line dark:bg-ink-soft">
          <div className="grid grid-cols-1 gap-3 rounded-xl bg-paper p-6 dark:bg-ink sm:grid-cols-4">
            {[
              { label: 'Applications', value: '24' },
              { label: 'Interviews', value: '6' },
              { label: 'Offers', value: '2' },
              { label: 'ATS avg. score', value: '82' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-paper-line bg-paper-soft p-4 dark:border-ink-line dark:bg-ink-soft">
                <p className="text-xs font-medium uppercase tracking-wide text-ink/50 dark:text-paper/50">{stat.label}</p>
                <p className="mt-2 font-data text-2xl font-semibold text-primary">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-bold">Everything your job search needs</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-paper-line bg-paper-soft p-6 dark:border-ink-line dark:bg-ink-soft">
              <div className="mb-4 w-fit rounded-xl bg-primary/10 p-2.5 text-primary dark:bg-primary/20 dark:text-primary-light">
                <Icon size={20} />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-paper-soft py-20 dark:bg-ink-soft">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center font-display text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary font-data text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-display text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ATS preview */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid items-center gap-10 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold">A transparent ATS score you can trust</h2>
            <p className="mt-4 text-ink/60 dark:text-paper/60">
              No black-box number. See exactly how keyword match, skills match, experience,
              education, and formatting each contribute to your overall score.
            </p>
            <ul className="mt-6 space-y-3">
              {['Matched & missing skills', 'Matched & missing keywords', 'Grounded recommendations — never fabricated'].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-accent" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-paper-line bg-paper-soft p-6 dark:border-ink-line dark:bg-ink-soft">
            {[
              ['Keyword Match', 92], ['Skills Match', 88], ['Experience Match', 84], ['Education Match', 95], ['Formatting', 90],
            ].map(([label, value]) => (
              <div key={label} className="mb-4 last:mb-0">
                <div className="mb-1 flex justify-between text-xs font-medium text-ink/60 dark:text-paper/60">
                  <span>{label}</span>
                  <span className="font-data">{value}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-paper-line dark:bg-ink-line">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing (UI only) */}
      <section className="bg-paper-soft py-20 dark:bg-ink-soft">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold">Simple pricing</h2>
          <p className="mt-3 text-ink/60 dark:text-paper/60">Start free. Upgrade when you need more AI analyses.</p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-paper-line bg-paper p-8 text-left dark:border-ink-line dark:bg-ink">
              <h3 className="font-display text-lg font-semibold">Free</h3>
              <p className="mt-2 font-data text-3xl font-bold">$0</p>
              <ul className="mt-6 space-y-2 text-sm text-ink/60 dark:text-paper/60">
                <li>Unlimited application tracking</li>
                <li>2 resumes</li>
                <li>5 ATS analyses / month</li>
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-paper p-8 text-left dark:bg-ink">
              <h3 className="font-display text-lg font-semibold text-primary">Pro</h3>
              <p className="mt-2 font-data text-3xl font-bold">$9<span className="text-sm font-normal">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm text-ink/60 dark:text-paper/60">
                <li>Unlimited resumes</li>
                <li>Unlimited ATS analyses</li>
                <li>Unlimited interview prep</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-bold">Frequently asked questions</h2>
        <div className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-paper-line bg-paper-soft p-5 dark:border-ink-line dark:bg-ink-soft">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <div className="rounded-2xl bg-primary px-8 py-14 text-white">
          <h2 className="font-display text-3xl font-bold">Ready to take control of your job search?</h2>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary"
          >
            Create your free account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-paper-line py-8 dark:border-ink-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-ink/50 dark:text-paper/50 sm:flex-row">
          <span>© {new Date().getFullYear()} CareerTrack AI</span>
          <span>Built as a full-stack SaaS demonstration project.</span>
        </div>
      </footer>
    </div>
  );
}
