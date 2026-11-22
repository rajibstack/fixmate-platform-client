"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Laptop,
  Wind,
  Refrigerator,
  Tv,
  WashingMachine,
  Zap,
  Clock,
  Award,
} from "lucide-react";

export const POPULAR_CATEGORIES = [
  {
    name: "Smartphone",
    queryValue: "Smartphone",
    icon: Smartphone,
    tagline: "Screens, battery, charging & board fix",
  },
  {
    name: "Laptop & PC",
    queryValue: "Laptop & PC",
    icon: Laptop,
    tagline: "Display, SSD, thermal & OS tune-up",
  },
  {
    name: "AC",
    queryValue: "AC & Refrigeration",
    icon: Wind,
    tagline: "Cooling check, gas recharge & PCB",
  },
  {
    name: "Refrigerator",
    queryValue: "AC & Refrigeration",
    icon: Refrigerator,
    tagline: "Compressor, thermostat & defrost fix",
  },
  {
    name: "TV",
    queryValue: "TV & Electronics",
    icon: Tv,
    tagline: "Panel backlight, audio & mainboard",
  },
  {
    name: "Washing Machine",
    queryValue: "Home Appliances",
    icon: WashingMachine,
    tagline: "Drum motor, drainage & spin repair",
  },
  {
    name: "Electrical",
    queryValue: "Electrical",
    icon: Zap,
    tagline: "Wiring, switchboard, inverter & safety",
  },
];

const DEFAULT_TRUST_STATS = [
  {
    value: "1,200+",
    label: "Verified Technicians",
    description: "Background-checked specialists across major repair categories.",
    icon: ShieldCheck,
  },
  {
    value: "18,500+",
    label: "Jobs Completed",
    description:
      "Devices and home appliances restored smoothly with clear pricing.",
    icon: Award,
  },
  {
    value: "Pay After Service",
    label: "Zero Upfront Stress",
    description: "Settle payment only after testing and confirming the repair.",
    icon: Clock,
  },
];

export default function PopularCategoriesTrustSection({
  categories = POPULAR_CATEGORIES,
  stats = DEFAULT_TRUST_STATS,
  selectedCategory = "",
  onSelectCategory,
  onNavigate,
  className = "",
}) {
  return (
    <section
      className={`max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-16 space-y-12 ${className}`}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Categories
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Popular Repair Categories
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Click a category to filter featured services below.
            </p>
          </div>

          <Link
            href="/services"
            onClick={() => onNavigate?.()}
            className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Browse all categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon || Zap;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory?.(cat.name)}
                className={`text-left h-full flex flex-col justify-between rounded-2xl p-5 border transition cursor-pointer ${
                  isSelected
                    ? "bg-sky-500/15 border-sky-500 text-slate-900 dark:text-white shadow-lg shadow-sky-500/10"
                    : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-sky-500/40 text-slate-900 dark:text-slate-100"
                }`}
              >
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isSelected
                        ? "bg-sky-500 text-slate-950 border-sky-400"
                        : "bg-slate-100 dark:bg-slate-950 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {cat.tagline}
                    </p>
                  </div>
                </div>

                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                  <span>{isSelected ? "Selected" : "Filter services"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg dark:shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Why Choose FixMate
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Built on Trust, Speed &amp; Accountability
            </h2>
          </div>
          <Link
            href="/services"
            onClick={() => onNavigate?.()}
            className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20 self-start sm:self-auto"
          >
            <span>Book a Repair</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((stat) => {
            const Icon = stat.icon || ShieldCheck;
            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-5 space-y-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                  {stat.label}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}