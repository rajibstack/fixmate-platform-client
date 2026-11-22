"use client";

import { useState } from "react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";
import AboutHeroSection from "@/components/about/AboutHeroSection";
import AboutHighlightsSection from "@/components/about/AboutHighlightsSection";
import HowFixMateWorksSection from "@/components/about/HowFixMateWorksSection";
import AboutTrustCtaSection from "@/components/about/AboutTrustCtaSection";

export default function AboutPage() {
  const [navigating, setNavigating] = useState(false);

  if (navigating) {
    return <PublicPageSkeleton cards={6} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16">
        <AboutHeroSection onNavigate={() => setNavigating(true)} />
        <AboutHighlightsSection />
        <HowFixMateWorksSection />
        <AboutTrustCtaSection onNavigate={() => setNavigating(true)} />
      </div>
    </div>
  );
}