"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function LayoutContent({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </>
  );
}

export default function LayoutWrapper({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}