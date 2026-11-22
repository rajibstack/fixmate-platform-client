"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wrench,
  ShieldCheck,
  DollarSign,
  ArrowUpRight,
  AlertCircle,
  CalendarCheck,
  RefreshCw,
} from "lucide-react";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function getBookingAmount(booking) {
  const raw =
    booking?.paidAmount ||
    booking?.finalAmount ||
    booking?.totalPrice ||
    booking?.startingPrice ||
    booking?.price ||
    0;
  const num = Number(raw);
  return Number.isNaN(num) ? 0 : num;
}

function formatStatusBadge(status = "") {
  const normalized = status
    .toString()
    .toLowerCase()
    .trim()
    .replace(/_/g, "-");
  if (normalized === "completed") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30";
  }
  if (
    normalized === "accepted" ||
    normalized === "in-progress" ||
    normalized === "in progress"
  ) {
    return "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30";
  }
  if (normalized === "rejected" || normalized === "cancelled") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30";
  }
  return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30";
}

function formatStatusLabel(status = "") {
  const normalized = status
    .toString()
    .toLowerCase()
    .trim()
    .replace(/_/g, "-");
  if (normalized === "in-progress" || normalized === "in progress") {
    return "In Progress";
  }
  if (!normalized || normalized === "pending") return "Requested";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function readStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readStoredToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function buildUserLookup(users = [], activeUser = null) {
  const byId = new Map();
  const byEmail = new Map();

  const allUsers = Array.isArray(users) ? [...users] : [];
  if (activeUser && typeof activeUser === "object") {
    allUsers.push(activeUser);
  }

  for (const u of allUsers) {
    if (!u || !u.name) continue;
    const id = String(u._id || u.id || "").trim();
    const email = String(u.email || "").trim().toLowerCase();
    if (id) byId.set(id, u);
    if (email) byEmail.set(email, u);
  }

  return { byId, byEmail };
}

function resolveName(
  record,
  { idKeys = [], emailKeys = [], fallbackKeys = [], defaultLabel },
  lookup
) {
  for (const key of idKeys) {
    const val = String(record?.[key] || "").trim();
    if (val && lookup?.byId?.get(val)?.name) {
      return lookup.byId.get(val).name;
    }
  }

  for (const key of emailKeys) {
    const val = String(record?.[key] || "").trim().toLowerCase();
    if (val && lookup?.byEmail?.get(val)?.name) {
      return lookup.byEmail.get(val).name;
    }
  }

  for (const key of fallbackKeys) {
    const val = String(record?.[key] || "").trim();
    if (val) return val;
  }

  return defaultLabel;
}

async function fetchJsonWithTimeout(url, headers, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      credentials: "include",
      headers,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  } catch (err) {
    return { ok: false, status: 0, json: {}, error: err };
  } finally {
    clearTimeout(timer);
  }
}

export default function AdminOverview({ user: propUser = null, syncVersion = 0 }) {
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [storedUser, setStoredUser] = useState(propUser);
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
  const activeRef = useRef(true);

  const loadAdminOverview = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }

    try {
      const token = readStoredToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [usersResult, servicesResult, bookingsResult] =
        await Promise.all([
          fetchJsonWithTimeout(`${API_URL}/api/admin/users`, headers),
          fetchJsonWithTimeout(`${API_URL}/api/admin/services`, headers),
          fetchJsonWithTimeout(`${API_URL}/api/admin/bookings`, headers),
        ]);

      if (!activeRef.current) return;

      const anySuccess =
        usersResult.ok || servicesResult.ok || bookingsResult.ok;

      if (!anySuccess) {
        if (!silent) {
          setError("Could not load platform overview data.");
        }
        return;
      }

      const fetchedUsers = usersResult.ok
        ? Array.isArray(usersResult.json?.data)
          ? usersResult.json.data
          : Array.isArray(usersResult.json)
          ? usersResult.json
          : []
        : [];

      if (fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      }

      const services = servicesResult.ok
        ? Array.isArray(servicesResult.json?.data)
          ? servicesResult.json.data
          : Array.isArray(servicesResult.json)
          ? servicesResult.json
          : []
        : [];

      const bookings = bookingsResult.ok
        ? Array.isArray(bookingsResult.json?.data)
          ? bookingsResult.json.data
          : Array.isArray(bookingsResult.json)
          ? bookingsResult.json
          : []
        : [];

      const customerCount = fetchedUsers.filter(
        (u) => (u?.role || "").toLowerCase().trim() === "customer"
      ).length;
      const totalTechnicians = fetchedUsers.filter(
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
        totalUsers: fetchedUsers.length,
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
      if (!silent && activeRef.current) {
        setError(err?.message || "Could not load platform overview.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  useEffect(() => {
    setStoredUser(propUser || readStoredUser());
  }, [propUser]);

  useEffect(() => {
    loadAdminOverview({ silent: syncVersion > 0 });
  }, [loadAdminOverview, syncVersion]);

  useEffect(() => {
    const handleLiveSync = () => {
      setStoredUser(readStoredUser());
      loadAdminOverview({ silent: true });
    };

    window.addEventListener("auth-change", handleLiveSync);
    window.addEventListener("storage", handleLiveSync);
    return () => {
      window.removeEventListener("auth-change", handleLiveSync);
      window.removeEventListener("storage", handleLiveSync);
    };
  }, [loadAdminOverview]);

  const userLookup = useMemo(
    () => buildUserLookup(users, storedUser),
    [users, storedUser]
  );

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Platform overview
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
          Users, services, jobs and revenue across FixMate.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3.5 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <p className="font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => loadAdminOverview()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total users
            </span>
            <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.totalUsers}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {`${stats.customerCount} customers`}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total technicians
            </span>
            <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.totalTechnicians}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Verified repair specialists
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Pending services
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.pendingServices}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {`${stats.approvedServices} approved`}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/15 via-white to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
              Total revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {`$${stats.totalRevenue}`}
            </p>
            <p className="text-xs text-sky-700/80 dark:text-sky-300/80 mt-1.5">
              {`${stats.paymentCount} payments`}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Two Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services waiting for review */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Services waiting for review
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  New technician listings
                </p>
              </div>
              <Link
                href="/dashboard/admin/services"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition"
              >
                <span>Review services</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingServicesList.length === 0 ? (
              <div className="py-10 px-5 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No services waiting for review right now.
                </p>
                <Link
                  href="/dashboard/admin/services"
                  onClick={() => setNavigating(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition"
                >
                  <span>Manage services</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {pendingServicesList.map((srv) => {
                  const id = srv._id || srv.id;
                  const techName = resolveName(
                    srv,
                    {
                      idKeys: ["technicianId"],
                      emailKeys: ["technicianEmail"],
                      fallbackKeys: ["technicianName"],
                      defaultLabel: "Technician",
                    },
                    userLookup
                  );
                  const metaParts = [techName, srv.category].filter(Boolean);

                  return (
                    <div
                      key={id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {srv.title || "Repair Service"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {metaParts.join(", ")}
                        </p>
                      </div>
                      <span className="text-base font-bold text-slate-900 dark:text-white shrink-0">
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
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Latest bookings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latest platform activity
                </p>
              </div>
              <Link
                href="/dashboard/admin/bookings"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition"
              >
                <span>All bookings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {latestBookingsList.length === 0 ? (
              <div className="py-10 px-5 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No bookings recorded yet.
                </p>
                <Link
                  href="/dashboard/admin/bookings"
                  onClick={() => setNavigating(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition"
                >
                  <span>View all bookings</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {latestBookingsList.map((booking) => {
                  const id = booking._id || booking.id;
                  const customerName = resolveName(
                    booking,
                    {
                      idKeys: ["customerId", "userId"],
                      emailKeys: ["customerEmail", "userEmail"],
                      fallbackKeys: ["customerName", "userName"],
                      defaultLabel: "Customer",
                    },
                    userLookup
                  );
                  const techName = resolveName(
                    booking,
                    {
                      idKeys: ["technicianId"],
                      emailKeys: ["technicianEmail"],
                      fallbackKeys: ["technicianName"],
                      defaultLabel: "Technician",
                    },
                    userLookup
                  );

                  return (
                    <div
                      key={id}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {booking.serviceTitle || "Repair Service"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
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