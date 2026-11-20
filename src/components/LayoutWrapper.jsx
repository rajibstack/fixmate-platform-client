"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";

function LayoutContent({ children }) {
  const pathname = usePathname();
  const isDashboard = Boolean(pathname && pathname.startsWith("/dashboard"));

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

export default function LayoutWrapper({ children }) {
  return (
    <Suspense fallback={<PublicPageSkeleton cards={6} />}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}