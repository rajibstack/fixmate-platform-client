"use client";

import { Suspense } from "react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";
import BrowseServicesSection from "@/components/services/BrowseServicesSection";
import ChooseHowYouUseSection from "@/components/services/ChooseHowYouUseSection";

export default function ServicesPage() {
  return (
    <Suspense fallback={<PublicPageSkeleton cards={8} />}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 sm:py-14 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          <BrowseServicesSection itemsPerPage={8} syncWithUrl basePath="/services" />
          <ChooseHowYouUseSection />
        </div>
      </div>
    </Suspense>
  );
}