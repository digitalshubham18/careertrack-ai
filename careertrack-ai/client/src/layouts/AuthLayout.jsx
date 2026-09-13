import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-sm font-bold text-white">
            CT
          </div>
          <span className="font-display text-lg font-semibold">CareerTrack AI</span>
        </Link>
        <Outlet />
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="absolute inset-0 bg-trajectory" />
        <div className="relative flex h-full flex-col items-start justify-center px-16">
          <h2 className="font-display text-4xl font-bold leading-tight text-paper">
            Track every application.
            <br />
            <span className="text-accent-light">Land your next job.</span>
          </h2>
          <p className="mt-4 max-w-md text-paper/60">
            AI-powered ATS scoring, resume optimization, and interview preparation —
            all in one dashboard built for a serious job search.
          </p>
          <svg viewBox="0 0 400 160" className="mt-12 w-full max-w-md text-accent">
            <polyline
              points="0,140 60,120 110,130 160,80 210,95 260,40 310,55 400,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="600"
              className="animate-drawline"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
