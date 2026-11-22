"use client";

import { useState } from "react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";
import ContactHeaderSection from "@/components/contact/ContactHeaderSection";
import ContactInfoCardsSection from "@/components/contact/ContactInfoCardsSection";
import ContactMessageFormSection from "@/components/contact/ContactMessageFormSection";
import ContactSidebarSection from "@/components/contact/ContactSidebarSection";

export default function ContactPage() {
  const [navigating, setNavigating] = useState(false);

  if (navigating) {
    return <PublicPageSkeleton cards={4} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 sm:space-y-12">
        <ContactHeaderSection />
        <ContactInfoCardsSection />

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <ContactMessageFormSection className="lg:col-span-7" />
          <ContactSidebarSection
            className="lg:col-span-5"
            onNavigate={() => setNavigating(true)}
          />
        </section>
      </div>
    </div>
  );
}