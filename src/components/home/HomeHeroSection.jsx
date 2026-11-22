"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const HERO_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1000&q=80";

export default function HomeHeroSection({
  averageRating = null,
  reviewsCount = 0,
  onNavigate,
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroImgSrc, setHeroImgSrc] = useState(HERO_FALLBACK_IMAGE);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    onNavigate?.();
    if (trimmed) {
      router.push(`/services?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/services");
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-transparent">
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[340px] rounded-full bg-sky-500/10 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 lg:py-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>On-Demand Device &amp; Appliance Repair</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Broken Device? Get It Fixed by{" "}
              <span className="text-sky-600 dark:text-sky-400">
                Verified Technicians
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
              Book trusted repair specialists for smartphones, laptops, ACs,
              fridges, TVs, and home appliances with upfront starting prices and
              pay-after-completion peace of mind.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row gap-3 pt-1 max-w-2xl"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search AC repair, laptop screen, fridge..."
                  className="w-full rounded-xl bg-white dark:bg-slate-900/95 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl transition shadow-lg shadow-sky-500/20 cursor-pointer shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/services"
                onClick={() => onNavigate?.()}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm px-5 py-3 rounded-xl transition shrink-0"
              >
                <span>Explore Services</span>
              </Link>
            </form>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Verified specialists
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Transparent starting prices
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                Pay after completion
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl dark:shadow-2xl space-y-5">
              <div className="aspect-[16/10] w-full rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden relative flex items-center justify-center">
                <img
                  src={heroImgSrc}
                  alt="Technician repairing electronics with precision tools"
                  onError={() => {
                    if (heroImgSrc !== HERO_FALLBACK_IMAGE) {
                      setHeroImgSrc(HERO_FALLBACK_IMAGE);
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 backdrop-blur-xs">
                    Same-Day Slot Available
                  </span>
                  <span className="text-xs font-medium text-slate-100 bg-slate-900/85 px-3 py-1 rounded-full border border-slate-700/80">
                    {averageRating && reviewsCount > 0
                      ? `${averageRating} ★ Rating`
                      : "4.9 ★ Rating"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Turnaround
                  </p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    Fast &amp; Reliable
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Service Modes
                  </p>
                  <p className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">
                    Home &amp; Workshop
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}