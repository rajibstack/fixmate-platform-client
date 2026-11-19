"use client";

import { useEffect, useState } from "react";
import TechnicianOverview from "@/components/overviews/TechnicianOverview";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

export default function TechnicianDashboardPage() {
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

  return <TechnicianOverview user={user} />;
}