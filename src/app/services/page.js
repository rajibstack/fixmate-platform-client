"use client";

import { Suspense } from "react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";
import BrowseServicesSection from "@/components/services/BrowseServicesSection";
import ChooseHowYouUseSection from "@/components/services/ChooseHowYouUseSection";

export default function ServicesPage() {
  return (
    <Suspense fallback={<PublicPageSkeleton cards={8} />}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <BrowseServicesSection
          itemsPerPage={8}
          syncWithUrl
          basePath="/services"
        />

        <div
          aria-hidden="true"
          className="h-px w-full bg-slate-200 dark:bg-slate-800/80"
        />

        <ChooseHowYouUseSection showTopBorder={false} />
      </div>
    </Suspense>
  );
}