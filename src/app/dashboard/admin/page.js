"use client";

import { useCallback, useEffect, useState } from "react";
import AdminOverview from "@/components/overviews/AdminOverview";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

function readStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  const syncUser = useCallback(() => {
    setUser(readStoredUser());
    setSyncVersion((prev) => prev + 1);
  }, []);

  useEffect(() => {
    setUser(readStoredUser());
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

  return <AdminOverview user={user} syncVersion={syncVersion} />;
}