"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { DashboardPageSkeleton, FixMateSpinner } from "@/components/ui/LoadingState";

export default function ErrorBoundaryPage({ error, reset }) {
  const [retrying, setRetrying] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    if (error) {
      console.error("FixMate Error Boundary caught:", error);
    }
  }, [error]);

  const handleRetry = () => {
    setRetrying(true);
    try {
      reset();
    } finally {
      setTimeout(() => setRetrying(false), 300);
    }
  };

  if (navigating) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        <DashboardPageSkeleton />
      </div>
    );
  }

  const clearMessage =
    error?.message && !error.message.includes("NEXT_")
      ? error.message
      : "An unexpected error interrupted this page. Please try again or return to the home page.";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-9 shadow-xl dark:shadow-2xl text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25">
            Something went wrong
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Unable to load this view
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            {clearMessage}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            disabled={retrying}
            onClick={handleRetry}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-semibold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            {retrying ? (
              <FixMateSpinner compact />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>{retrying ? "Retrying..." : "Try again"}</span>
          </button>

          <Link
            href="/"
            onClick={() => setNavigating(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm px-5 py-3 rounded-xl transition"
          >
            <Home className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}