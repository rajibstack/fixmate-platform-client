"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function AboutHeroSection({ onNavigate }) {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl dark:shadow-2xl">
      <div className="max-w-3xl space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>About FixMate</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          Reliable repairs for your{" "}
          <span className="text-sky-600 dark:text-sky-400">
            devices and home appliances
          </span>
          .
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          FixMate connects homeowners and everyday users with skilled repair
          technicians for smartphones, laptops, ACs, refrigerators, TVs, and
          home electrical or appliance needs—without guesswork, hidden
          surprises, or scattered follow-ups.
        </p>

        <div className="flex flex-wrap items-center gap-3.5 pt-2">
          <Link
            href="/services"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition shadow-lg shadow-sky-500/20"
          >
            <span>Browse services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/sign-in"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold transition"
          >
            <span>Go to dashboard</span>
          </Link>
        </div>
      </div>
    </section>
  );
}