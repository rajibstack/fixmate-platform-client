"use client";

import { MessageSquare } from "lucide-react";

export default function ContactHeaderSection({ className = "" }) {
  return (
    <section
      className={`bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl ${className}`}
    >
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Contact Us</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
          Get in touch with{" "}
          <span className="text-sky-600 dark:text-sky-400">
            FixMate support
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Have a question about a device or home appliance repair, need help with
          an existing booking, or want to join as a technician? Send us a
          message below.
        </p>
      </div>
    </section>
  );
}