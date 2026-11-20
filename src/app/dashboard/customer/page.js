"use client";

import { useCallback, useEffect, useState } from "react";
import CustomerOverview from "@/components/overviews/CustomerOverview";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

function readStoredUser() {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function CustomerDashboardPage() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const syncUser = useCallback(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    syncUser();
    setReady(true);

    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-change", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-change", syncUser);
    };
  }, [syncUser]);

  if (!ready) {
    return <DashboardPageSkeleton />;
  }

  return <CustomerOverview user={user} />;
}