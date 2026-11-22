"use client";

import Link from "next/link";
import { ShieldCheck, Wrench } from "lucide-react";

const DEFAULT_QUICK_NOTES = [
  "Include your ticket code (e.g. #FM-1024) if asking about an active repair.",
  "Want to list your repair services? Sign up or sign in with a technician account.",
  "For payment status or invoice questions, check your dashboard payment records first.",
];

export default function ContactSidebarSection({
  notes = DEFAULT_QUICK_NOTES,
  onNavigate,
  className = "",
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Helpful tips before writing
          </h2>
        </div>

        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note}
              className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 mt-2 shrink-0" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gradient-to-br from-sky-500/15 via-white to-slate-100 dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl dark:shadow-sky-500/5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Wrench className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Need a repair right away?
          </h2>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300/90 leading-relaxed">
          Browse approved technicians and book a repair slot directly, or open
          your dashboard to track an active job.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/services"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition shadow-md shadow-sky-500/20"
          >
            Browse services
          </Link>
          <Link
            href="/sign-in"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-950/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}