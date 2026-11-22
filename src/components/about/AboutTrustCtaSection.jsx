"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const DEFAULT_PILLARS = [
  "Every new technician service goes through admin review before going live.",
  "Customers only pay after a repair job reaches the completed stage.",
  "Technicians get a focused queue to accept, reject, start, and finish jobs.",
  "Admins oversee users, service approvals, all bookings, and revenue in one place.",
];

export default function AboutTrustCtaSection({
  pillars = DEFAULT_PILLARS,
  onNavigate,
  className = "",
}) {
  return (
    <section
      className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch ${className}`}
    >
      <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md dark:shadow-xl space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Built around trust and clarity
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Every part of FixMate is designed to keep repair jobs organized and
            accountable.
          </p>
        </div>

        <ul className="space-y-3.5">
          {pillars.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"
            >
              <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-5 bg-gradient-to-br from-sky-500/15 via-white to-slate-100 dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-md dark:shadow-xl dark:shadow-sky-500/5 flex flex-col justify-between gap-6">
        <div className="space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            Get Started
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
            Need a quick fix or want to offer repair services?
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300/90 leading-relaxed">
            Book a technician for your device or appliance today, or join as a
            technician to manage repair requests and grow your service listings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/services"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition shadow-md shadow-sky-500/20"
          >
            <span>Explore services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/sign-up"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-950/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold transition"
          >
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}