"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CustomerOverview from "@/components/overviews/CustomerOverview";
import TechnicianOverview from "@/components/overviews/TechnicianOverview";
import AdminOverview from "@/components/overviews/AdminOverview";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

function readSessionUser() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;

    const hasIdentity = Boolean(parsed.email || parsed._id || parsed.id);
    const hasToken = Boolean(token || parsed.token);

    if (!hasIdentity && !hasToken) return null;
    return parsed;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export default function DashboardOverviewClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);

  const loadUser = useCallback(() => {
    const nextUser = readSessionUser();
    setUser(nextUser);
    setSyncVersion((prev) => prev + 1);
    setLoading(false);
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
    if (!loading && !user && !redirecting) {
      setRedirecting(true);
      router.replace("/sign-in");
    }
  }, [loading, user, redirecting, router]);

  if (loading || !user || redirecting) {
    return <DashboardPageSkeleton />;
  }

  const role = (user?.role || "customer").toString().toLowerCase().trim();

  if (role === "admin") {
    return (
      <AdminOverview
        key={`admin-${syncVersion}`}
        user={user}
        syncVersion={syncVersion}
      />
    );
  }

  if (role === "technician") {
    return (
      <TechnicianOverview
        key={`tech-${syncVersion}`}
        user={user}
        syncVersion={syncVersion}
      />
    );
  }

  return (
    <CustomerOverview
      key={`customer-${syncVersion}`}
      user={user}
      syncVersion={syncVersion}
    />
  );
}