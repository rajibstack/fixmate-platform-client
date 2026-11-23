"use client";

import { useState } from "react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";
import AboutHeroSection from "@/components/about/AboutHeroSection";
import AboutHighlightsSection from "@/components/about/AboutHighlightsSection";
import AboutTrustCtaSection from "@/components/about/AboutTrustCtaSection";
import HowFixMateWorksHomeSection from "@/components/home/HowFixMateWorksHomeSection";

export default function AboutPage() {
  const [navigating, setNavigating] = useState(false);

  if (navigating) {
    return <PublicPageSkeleton cards={6} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="bg-slate-50/90 dark:bg-slate-950 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16">
          <AboutHeroSection onNavigate={() => setNavigating(true)} />
          <AboutHighlightsSection />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="h-px w-full bg-slate-200 dark:bg-slate-800/80"
      />

      <HowFixMateWorksHomeSection />

      <div
        aria-hidden="true"
        className="h-px w-full bg-slate-200 dark:bg-slate-800/80"
      />

      <div className="bg-white/75 dark:bg-slate-900/45 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <AboutTrustCtaSection onNavigate={() => setNavigating(true)} />
        </div>
      </div>
    </div>
  );
}