"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";

const highlights = [
  {
    label: "Verified Specialists",
    value: "100%",
    note: "Vetted device & home appliance technicians",
    icon: ShieldCheck,
    accent: "text-sky-400",
  },
  {
    label: "Step-by-Step Tracking",
    value: "Real-Time",
    note: "From requested to accepted, in progress & completed",
    icon: ClipboardCheck,
    accent: "text-emerald-400",
  },
  {
    label: "Transparent Billing",
    value: "Clear",
    note: "Upfront starting price & instant payment records",
    icon: CreditCard,
    accent: "text-amber-300",
  },
  {
    label: "Multi-Role Platform",
    value: "3 Roles",
    note: "Dedicated workflows for customers, techs & admins",
    icon: Users,
    accent: "text-indigo-300",
  },
];

const steps = [
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

const pillars = [
  "Every new technician service goes through admin review before going live.",
  "Customers only pay after a repair job reaches the completed stage.",
  "Technicians get a focused queue to accept, reject, start, and finish jobs.",
  "Admins oversee users, service approvals, all bookings, and revenue in one place.",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>About FixMate</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Reliable repairs for your{" "}
              <span className="text-sky-400">devices and home appliances</span>.
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              FixMate connects homeowners and everyday users with skilled repair
              technicians for smartphones, laptops, ACs, refrigerators, TVs, and
              home electrical or appliance needs—without guesswork, hidden
              surprises, or scattered follow-ups.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition shadow-lg shadow-sky-500/20"
              >
                <span>Browse services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-200 text-sm font-semibold transition"
              >
                <span>Go to dashboard</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-6 flex flex-col justify-between shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-400">
                    {item.label}
                  </span>
                  <Icon className={`w-4 h-4 ${item.accent}`} />
                </div>
                <div className="mt-4">
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {item.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* How It Works */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-slate-800/90">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                How FixMate works
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                A simple, structured workflow from repair request to final
                payment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between gap-5 transition"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                        Step {item.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why FixMate + CTA Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Built around trust and clarity
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Every part of FixMate is designed to keep repair jobs organized
                and accountable.
              </p>
            </div>

            <ul className="space-y-3.5">
              {pillars.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-500/5 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Get Started
              </span>
              <h2 className="text-2xl font-bold text-white leading-snug">
                Need a quick fix or want to offer repair services?
              </h2>
              <p className="text-sm text-slate-300/90 leading-relaxed">
                Book a technician for your device or appliance today, or join
                as a technician to manage repair requests and grow your service
                listings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition shadow-md shadow-sky-500/20"
              >
                <span>Explore services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-white text-sm font-semibold transition"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}