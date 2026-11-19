"use client";

import { useEffect, useState } from "react";
import CustomerOverview from "@/components/overviews/CustomerOverview";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

export default function CustomerDashboardPage() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return <DashboardPageSkeleton />;
  }

  return <CustomerOverview user={user} />;
}