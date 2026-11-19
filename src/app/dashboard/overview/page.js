"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CustomerOverview from "@/components/overviews/CustomerOverview";
import TechnicianOverview from "@/components/overviews/TechnicianOverview";
import AdminOverview from "@/components/overviews/AdminOverview";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) {
        setUser(null);
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(stored);
      setUser(parsed && typeof parsed === "object" ? parsed : null);
    } catch {
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [loadUser]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <DashboardPageSkeleton />;
  }

  if (user.role === "admin") {
    return <AdminOverview user={user} />;
  }

  if (user.role === "technician") {
    return <TechnicianOverview user={user} />;
  }

  return <CustomerOverview user={user} />;
}