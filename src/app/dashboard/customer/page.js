"use client";

import { useEffect, useState } from "react";
import CustomerOverview from "@/components/overviews/CustomerOverview";

export default function CustomerDashboardPage() {
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

  return <CustomerOverview user={user} />;
}