"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wrench,
  ShieldCheck,
  DollarSign,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

function getBookingAmount(booking) {
  const raw =
    booking?.finalAmount ??
    booking?.totalPrice ??
    booking?.startingPrice ??
    booking?.price ??
    0;
  const num = Number(raw);
  return Number.isNaN(num) ? 0 : num;
}

function formatStatusBadge(status = "") {
  const normalized = status.toString().toLowerCase().trim().replace(/_/g, "-");
  if (normalized === "completed") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  }
  if (normalized === "accepted" || normalized === "in-progress" || normalized === "in progress") {
    return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
  }
  if (normalized === "rejected" || normalized === "cancelled") {
    return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  }
  return "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30";
}

function formatStatusLabel(status = "") {
  const normalized = status.toString().toLowerCase().trim().replace(/_/g, "-");
  if (normalized === "in-progress" || normalized === "in progress") {
    return "In Progress";
  }
  if (!normalized || normalized === "pending") return "Requested";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    customerCount: 0,
    totalTechnicians: 0,
    pendingServices: 0,
    approvedServices: 0,
    totalRevenue: 0,
    paymentCount: 0,
  });
  const [pendingServicesList, setPendingServicesList] = useState([]);
  const [latestBookingsList, setLatestBookingsList] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const overviewRes = await fetch(`${apiUrl}/api/admin/overview`, {
        headers,
      });

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json().catch(() => ({}));
        if (overviewData?.stats) {
          setStats((prev) => ({ ...prev, ...overviewData.stats }));
          setPendingServicesList(overviewData.pendingServices || []);
          setLatestBookingsList(overviewData.recentBookings || []);
          setLoading(false);
          return;
        }
      }

      const [usersRes, servicesRes, bookingsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/users`, { headers }),
        fetch(`${apiUrl}/api/admin/services`, { headers }),
        fetch(`${apiUrl}/api/admin/bookings`, { headers }),
      ]);

      if (!usersRes.ok && !servicesRes.ok && !bookingsRes.ok) {
        throw new Error("Failed to load platform overview data.");
      }

      const usersJson = usersRes.ok ? await usersRes.json().catch(() => ({})) : {};
      const servicesJson = servicesRes.ok
        ? await servicesRes.json().catch(() => ({}))
        : {};
      const bookingsJson = bookingsRes.ok
        ? await bookingsRes.json().catch(() => ({}))
        : {};

      const users = Array.isArray(usersJson?.data)
        ? usersJson.data
        : Array.isArray(usersJson)
        ? usersJson
        : [];
      const services = Array.isArray(servicesJson?.data)
        ? servicesJson.data
        : Array.isArray(servicesJson)
        ? servicesJson
        : [];
      const bookings = Array.isArray(bookingsJson?.data)
        ? bookingsJson.data
        : Array.isArray(bookingsJson)
        ? bookingsJson
        : [];

      const customerCount = users.filter(
        (u) => (u?.role || "").toLowerCase().trim() === "customer"
      ).length;
      const totalTechnicians = users.filter(
        (u) => (u?.role || "").toLowerCase().trim() === "technician"
      ).length;

      const pendingList = services.filter(
        (s) => (s?.status || "").toLowerCase().trim() === "pending"
      );
      const approvedCount = services.filter(
        (s) =>
          (s?.status || "approved").toString().toLowerCase().trim() ===
          "approved"
      ).length;

      const paidBookings = bookings.filter(
        (b) => (b?.paymentStatus || "").toLowerCase().trim() === "paid"
      );
      const totalRevenue = paidBookings.reduce(
        (sum, item) => sum + getBookingAmount(item),
        0
      );

      setStats({
        totalUsers: users.length,
        customerCount,
        totalTechnicians,
        pendingServices: pendingList.length,
        approvedServices: approvedCount,
        totalRevenue,
        paymentCount: paidBookings.length,
      });

      setPendingServicesList(pendingList.slice(0, 5));
      setLatestBookingsList(bookings.slice(0, 5));
    } catch (err) {
      setError(err.message || "Could not load platform overview.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800/90">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Platform overview
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          Users, services, jobs and revenue across FixMate.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3.5 text-sm text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <p className="font-medium flex-1">{error}</p>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Total users
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            <p className="text-xs text-slate-400 mt-1.5">
              {`${stats.customerCount} customers`}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Total technicians
            </span>
            <Wrench className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {stats.totalTechnicians}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Verified repair specialists
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Pending services
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {stats.pendingServices}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              {`${stats.approvedServices} approved`}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-300">
              Total revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {`$${stats.totalRevenue}`}
            </p>
            <p className="text-xs text-sky-300/80 mt-1.5">
              {`${stats.paymentCount} payments`}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Two Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services waiting for review */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Services waiting for review
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  New technician listings
                </p>
              </div>
              <Link
                href="/dashboard/admin/services"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
              >
                <span>Review services</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingServicesList.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl text-sm text-slate-400">
                No services waiting for review right now.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {pendingServicesList.map((srv) => {
                  const id = srv._id || srv.id;
                  const metaParts = [
                    srv.technicianName || "Technician",
                    srv.category,
                  ].filter(Boolean);

                  return (
                    <div
                      key={id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {srv.title || "Repair Service"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 truncate">
                          {metaParts.join(", ")}
                        </p>
                      </div>
                      <span className="text-base font-bold text-white shrink-0">
                        {`$${Number(srv.price || 0)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Latest bookings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Latest bookings
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Latest platform activity
                </p>
              </div>
              <Link
                href="/dashboard/admin/bookings"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
              >
                <span>All bookings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {latestBookingsList.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl text-sm text-slate-400">
                No bookings recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {latestBookingsList.map((booking) => {
                  const id = booking._id || booking.id;
                  const customerName = booking.customerName || "Customer";
                  const techName = booking.technicianName || "Technician";

                  return (
                    <div
                      key={id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {booking.serviceTitle || "Repair Service"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 truncate">
                          {customerName} with {techName}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full shrink-0 ${formatStatusBadge(
                          booking.status
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {formatStatusLabel(booking.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}