"use client";

import { useEffect, useState } from "react";
import AdminOverview from "@/components/overviews/AdminOverview";

export default function AdminDashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      setUser(null);
    }
  }, []);

  return <AdminOverview user={user} />;
}