"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";

const DEFAULT_CONTACT_METHODS = [
  {
    label: "Support Email",
    value: "support@fixmate.com",
    note: "We typically reply within a few hours",
    icon: Mail,
    accent: "text-sky-600 dark:text-sky-400",
    href: "mailto:support@fixmate.com",
  },
  {
    label: "Phone & Hotline",
    value: "+880 123 456 789",
    note: "Direct help for urgent repair requests",
    icon: Phone,
    accent: "text-emerald-600 dark:text-emerald-400",
    href: "tel:+880123456789",
  },
  {
    label: "Service Hours",
    value: "Sat – Thu, 9 AM – 9 PM",
    note: "Technician dispatch & customer support",
    icon: Clock,
    accent: "text-amber-600 dark:text-amber-300",
    href: null,
  },
  {
    label: "Location",
    value: "123 Tech Street, Digital Avenue",
    note: "Device & home appliance repair network",
    icon: MapPin,
    accent: "text-indigo-600 dark:text-indigo-300",
    href: null,
  },
];

export default function ContactInfoCardsSection({
  methods = DEFAULT_CONTACT_METHODS,
  className = "",
}) {
  return (
    <section
      className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 ${className}`}
    >
      {methods.map((item) => {
        const Icon = item.icon || Mail;
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
                className={`w-4 h-4 ${
                  item.accent || "text-sky-600 dark:text-sky-400"
                }`}
              />
            </div>

            <div className="mt-4">
              {item.href ? (
                <a
                  href={item.href}
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition break-words"
                >
                  {item.value}
                </a>
              ) : (
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
                  {item.value}
                </p>
              )}
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