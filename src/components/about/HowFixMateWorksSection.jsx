"use client";

import {
  CheckCircle2,
  SearchCheck,
  Wrench,
} from "lucide-react";

const DEFAULT_STEPS = [
  {
    step: "01",
    title: "Choose a service & book",
    description:
      "Browse approved repair services by category, pick your preferred date and location, and share a clear problem description.",
    icon: SearchCheck,
  },
  {
    step: "02",
    title: "Track repair progress live",
    description:
      "Once a technician accepts your request, follow every stage—Accepted, In Progress, and Completed—right from your dashboard.",
    icon: Wrench,
  },
  {
    step: "03",
    title: "Pay once work is finished",
    description:
      "After the repair is marked completed, review the final amount, complete your payment, and keep a clean transaction record.",
    icon: CheckCircle2,
  },
];

export default function HowFixMateWorksSection({
  steps = DEFAULT_STEPS,
  className = "",
}) {
  return (
    <section className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800/90">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            How FixMate works
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            A simple, structured workflow from repair request to final payment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((item) => {
          const Icon = item.icon || Wrench;
          return (
            <div
              key={item.step}
              className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/90 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl flex flex-col justify-between gap-5 transition"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                    Step {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}