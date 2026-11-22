"use client";

import { Wrench } from "lucide-react";

export function FixMateSpinner({ label = "Loading...", compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        compact ? "py-8" : "min-h-[60vh] py-12"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-lg shadow-sky-500/10">
          <Wrench className="w-5 h-5 animate-pulse" />
        </div>
        <span className="absolute -inset-1 rounded-2xl border-2 border-transparent border-t-sky-600 dark:border-t-sky-400 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}

export function PublicPageSkeleton({ cards = 6 }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 space-y-4 shadow-xs dark:shadow-none">
          <div className="h-6 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-3/4 max-w-xl rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2 max-w-2xl">
            <div className="h-4 w-full rounded-lg bg-slate-200/80 dark:bg-slate-800/80" />
            <div className="h-4 w-5/6 rounded-lg bg-slate-200/80 dark:bg-slate-800/80" />
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: cards }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs dark:shadow-none"
            >
              <div className="h-40 w-full rounded-2xl bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="flex items-center justify-between gap-3">
                <div className="h-5 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-16 rounded-full bg-sky-500/15" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
                <div className="h-3.5 w-4/5 rounded bg-slate-200/70 dark:bg-slate-800/70" />
              </div>
              <div className="pt-2 flex items-center justify-between">
                <div className="h-6 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 w-24 rounded-xl bg-sky-500/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Top Banner / Header Skeleton */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs dark:shadow-none">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-72 max-w-full rounded bg-slate-200/70 dark:bg-slate-800/70" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-xs dark:shadow-none"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-200/80 dark:bg-slate-800/80" />
              <div className="h-4 w-4 rounded bg-sky-500/20" />
            </div>
            <div className="h-7 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-32 rounded bg-slate-200/60 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>

      {/* Main Content Block Skeleton */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs dark:shadow-none">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-14 w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800/70"
          />
        ))}
      </div>
    </div>
  );
}