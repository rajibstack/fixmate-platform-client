"use client";

import { useEffect, useState } from "react";
import TechnicianOverview from "@/components/overviews/TechnicianOverview";

export default function TechnicianDashboardPage() {
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

  return <TechnicianOverview user={user} />;
}