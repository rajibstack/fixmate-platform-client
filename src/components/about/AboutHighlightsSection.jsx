"use client";

import {
  ClipboardCheck,
  CreditCard,
  ShieldCheck,
  Users,
} from "lucide-react";

const DEFAULT_HIGHLIGHTS = [
  {
    label: "Verified Specialists",
    value: "100%",
    note: "Vetted device & home appliance technicians",
    icon: ShieldCheck,
    accent: "text-sky-600 dark:text-sky-400",
  },
  {
    label: "Step-by-Step Tracking",
    value: "Real-Time",
    note: "From requested to accepted, in progress & completed",
    icon: ClipboardCheck,
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Transparent Billing",
    value: "Clear",
    note: "Upfront starting price & instant payment records",
    icon: CreditCard,
    accent: "text-amber-600 dark:text-amber-300",
  },
  {
    label: "Multi-Role Platform",
    value: "3 Roles",
    note: "Dedicated workflows for customers, techs & admins",
    icon: Users,
    accent: "text-indigo-600 dark:text-indigo-300",
  },
];

export default function AboutHighlightsSection({
  items = DEFAULT_HIGHLIGHTS,
  className = "",
}) {
  return (
    <section
      className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 ${className}`}
    >
      {items.map((item) => {
        const Icon = item.icon || ShieldCheck;
        return (
          <div
            key={item.label}
            className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/90 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {item.label}
              </span>
              <Icon
                className={`w-4 h-4 ${item.accent || "text-sky-600 dark:text-sky-400"}`}
              />
            </div>
            <div className="mt-4">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {item.value}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {item.note}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}