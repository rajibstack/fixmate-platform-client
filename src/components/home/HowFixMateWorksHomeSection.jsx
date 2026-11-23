"use client";

import {
  Search,
  ArrowRight,
  Wrench,
  Send,
  CheckCircle2,
} from "lucide-react";

const DEFAULT_STEPS = [
  {
    step: "01",
    title: "Find a Service",
    description:
      "Browse verified repair listings by device category, service mode, and transparent starting price.",
    icon: Search,
  },
  {
    step: "02",
    title: "Send a Request",
    description:
      "Pick a convenient time slot and share your device issue or home visit details in seconds.",
    icon: Send,
  },
  {
    step: "03",
    title: "Technician Fixes It",
    description:
      "A vetted technician diagnoses the fault and completes the repair using reliable parts.",
    icon: Wrench,
  },
  {
    step: "04",
    title: "Pay After Completion",
    description:
      "Inspect your working device first and pay only once the repair job is finished to your satisfaction.",
    icon: CheckCircle2,
  },
];

const STEP_CARD_STYLES = [
  "bg-gradient-to-tl from-sky-500/10 via-sky-500/[0.03] to-white dark:from-sky-500/15 dark:via-slate-900 dark:to-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-500/35",
  "bg-gradient-to-tl from-sky-500/15 via-sky-500/[0.05] to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border-sky-500/20 hover:border-sky-500/40",
  "bg-gradient-to-tl from-sky-600/20 via-sky-500/10 to-white dark:from-sky-500/25 dark:via-slate-900 dark:to-slate-900 border-sky-500/30 hover:border-sky-500/50",
  "bg-gradient-to-tl from-sky-600/30 via-sky-500/15 to-white dark:from-sky-500/35 dark:via-sky-950/40 dark:to-slate-900 border-sky-500/40 hover:border-sky-500/60",
];

const STEP_BADGE_STYLES = [
  "text-slate-400 dark:text-slate-500",
  "text-sky-600/75 dark:text-sky-400/75",
  "text-sky-600/90 dark:text-sky-400/90",
  "text-sky-600 dark:text-sky-400",
];

export default function HowFixMateWorksHomeSection({
  steps = DEFAULT_STEPS,
  className = "",
}) {
  return (
    <section
      className={`border-y border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/40 py-14 sm:py-16 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Simple Process
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            How FixMate Works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Four straightforward steps from booking to a working device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((item, idx) => {
            const Icon = item.icon || Wrench;
            const cardStyle =
              STEP_CARD_STYLES[idx] || STEP_CARD_STYLES[STEP_CARD_STYLES.length - 1];
            const badgeStyle =
              STEP_BADGE_STYLES[idx] || STEP_BADGE_STYLES[STEP_BADGE_STYLES.length - 1];

            return (
              <div
                key={item.step}
                className={`h-full flex flex-col justify-between border rounded-3xl p-6 shadow-md dark:shadow-lg relative transition ${cardStyle}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold tracking-widest ${badgeStyle}`}
                    >
                      STEP {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="mt-5 pt-3 border-t border-slate-200/80 dark:border-slate-800/70 flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}