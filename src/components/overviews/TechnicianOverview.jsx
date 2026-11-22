"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpRight,
  Calendar,
  Inbox,
  Wallet,
  Plus,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

function formatShortDate(dateValue) {
  if (!dateValue) return "—";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue);
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTicketCode(booking) {
  if (booking?.ticketNumber) return booking.ticketNumber;
  if (booking?.bookingCode) return booking.bookingCode;
  const rawId = String(booking?._id || booking?.id || "");
  if (!rawId) return "#FM-0000";
  const numericTail = rawId
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9000, 1000);
  return `#FM-${numericTail}`;
}

function getBookingAmount(booking) {
  const rawAmount =
    booking?.paidAmount ||
    booking?.finalAmount ||
    booking?.totalPrice ||
    booking?.startingPrice ||
    booking?.price ||
    0;
  const num = Number(rawAmount);
  return Number.isNaN(num) ? 0 : num;
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

function buildUserLookup(users = [], storedUser = null) {
  const byId = new Map();
  const byEmail = new Map();

  const allUsers = Array.isArray(users) ? [...users] : [];
  if (storedUser && typeof storedUser === "object") {
    allUsers.push(storedUser);
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

function resolveCustomerName(record, lookup) {
  const id = String(
    record?.customerId || record?.userId || record?.customer?._id || ""
  ).trim();
  const email = String(
    record?.customerEmail || record?.userEmail || record?.customer?.email || ""
  )
    .trim()
    .toLowerCase();

  const matched =
    (id && lookup?.byId?.get(id)) || (email && lookup?.byEmail?.get(email));

  return (
    matched?.name ||
    record?.customer?.name ||
    record?.customerName ||
    record?.userName ||
    "Customer"
  );
}

export default function TechnicianOverview() {
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [storedUser, setStoredUser] = useState(null);
  const [stats, setStats] = useState({
    totalServices: 0,
    approvedServices: 0,
    pendingReviewServices: 0,
    pendingRequests: 0,
    totalEarnings: 0,
  });
  const [newRequests, setNewRequests] = useState([]);
  const [recentEarnings, setRecentEarnings] = useState([]);

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const fetchTechnicianData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken") ||
          "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [servicesRes, bookingsRes, usersRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/technician/services`, {
            cache: "no-store",
            headers,
          }),
          fetch(`${apiUrl}/api/technician/bookings`, {
            cache: "no-store",
            headers,
          }),
          fetch(`${apiUrl}/api/admin/users`, {
            cache: "no-store",
            headers,
          }),
        ]);

        let servicesList = [];
        let loadError = "";

        if (servicesRes.status === "fulfilled") {
          const sData = await servicesRes.value.json().catch(() => ({}));
          if (servicesRes.value.ok) {
            servicesList = Array.isArray(sData?.data)
              ? sData.data
              : Array.isArray(sData)
              ? sData
              : [];
          } else {
            loadError = sData?.message || "Could not load your services.";
          }
        }

        let bookingsList = [];
        if (bookingsRes.status === "fulfilled") {
          const bData = await bookingsRes.value.json().catch(() => ({}));
          if (bookingsRes.value.ok) {
            bookingsList = Array.isArray(bData?.data)
              ? bData.data
              : Array.isArray(bData)
              ? bData
              : [];
          } else if (!loadError) {
            loadError = bData?.message || "Could not load your bookings.";
          }
        }

        if (usersRes.status === "fulfilled" && usersRes.value.ok) {
          const uData = await usersRes.value.json().catch(() => ({}));
          const userList = Array.isArray(uData?.data)
            ? uData.data
            : Array.isArray(uData)
            ? uData
            : [];
          if (userList.length > 0) {
            setUsers(userList);
          }
        }

        if (loadError && !silent) {
          setError(loadError);
        }

        const approvedCount = servicesList.filter(
          (s) =>
            (s?.status || "").toString().toLowerCase().trim() === "approved"
        ).length;

        const pendingReviewCount = servicesList.filter(
          (s) => (s?.status || "").toString().toLowerCase().trim() === "pending"
        ).length;

        const requestedBookings = bookingsList.filter(
          (b) =>
            (b?.status || "").toString().toLowerCase().trim() === "requested"
        );

        const paidBookings = bookingsList
          .filter(
            (b) =>
              (b?.paymentStatus || "").toString().toLowerCase().trim() === "paid"
          )
          .sort((a, b) => {
            const dateA = new Date(
              a?.paidAt || a?.updatedAt || a?.createdAt || 0
            ).getTime();
            const dateB = new Date(
              b?.paidAt || b?.updatedAt || b?.createdAt || 0
            ).getTime();
            return dateB - dateA;
          });

        const earningsSum = paidBookings.reduce(
          (acc, item) => acc + getBookingAmount(item),
          0
        );

        setStats({
          totalServices: servicesList.length,
          approvedServices: approvedCount,
          pendingReviewServices: pendingReviewCount,
          pendingRequests: requestedBookings.length,
          totalEarnings: earningsSum,
        });

        setNewRequests(requestedBookings.slice(0, 4));
        setRecentEarnings(paidBookings.slice(0, 4));
      } catch {
        if (!silent) {
          setError("Network error while loading technician overview.");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    setStoredUser(readStoredUser());
    fetchTechnicianData();

    const handleLiveSync = () => {
      setStoredUser(readStoredUser());
      fetchTechnicianData({ silent: true });
    };

    window.addEventListener("auth-change", handleLiveSync);
    window.addEventListener("storage", handleLiveSync);
    return () => {
      window.removeEventListener("auth-change", handleLiveSync);
      window.removeEventListener("storage", handleLiveSync);
    };
  }, [fetchTechnicianData]);

  const userLookup = useMemo(
    () => buildUserLookup(users, storedUser),
    [users, storedUser]
  );

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Overview
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Your services, jobs and earnings.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchTechnicianData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total services
            </span>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.totalServices}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Listed under your profile
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Approved services
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.approvedServices}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              {`${stats.pendingReviewServices} waiting for review`}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Pending requests
            </span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.pendingRequests}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Waiting for you to accept or decline
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/15 via-white to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
              Total earnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {`$${stats.totalEarnings}`}
            </p>
            <p className="text-xs text-sky-700/80 dark:text-sky-300/80 mt-1.5">
              Completed &amp; settled payouts
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Requests */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                New requests
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Incoming repair bookings
              </p>
            </div>
            <Link
              href="/dashboard/technician/requests"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition"
            >
              <span>Manage requests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {newRequests.length === 0 ? (
            <div className="py-10 px-5 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No pending requests
              </p>
              <p className="text-xs text-slate-500">
                New customer repair requests will appear here.
              </p>
              <Link
                href="/dashboard/technician/my-services"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition"
              >
                <span>View my services</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {newRequests.map((req) => {
                const customerName = resolveCustomerName(req, userLookup);
                return (
                  <div
                    key={req._id || req.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {req.serviceTitle || "Repair Service"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                        <span>{customerName},</span>
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                          preferred {formatShortDate(req.preferredDate)}
                        </span>
                      </p>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {getTicketCode(req)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Earnings */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent earnings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Jobs customers have paid for
            </p>
          </div>

          {recentEarnings.length === 0 ? (
            <div className="py-10 px-5 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No settled earnings yet
              </p>
              <p className="text-xs text-slate-500">
                Paid completed repairs will show up here.
              </p>
              <Link
                href="/dashboard/technician/add-service"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition shadow-md shadow-sky-500/15"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add a service</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {recentEarnings.map((item) => {
                const customerName = resolveCustomerName(item, userLookup);
                return (
                  <div
                    key={item._id || item.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {item.serviceTitle || "Repair Service"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {customerName},{" "}
                        {formatShortDate(
                          item.paidAt || item.updatedAt || item.createdAt
                        )}
                      </p>
                    </div>
                    <span className="text-base font-bold text-sky-600 dark:text-sky-400 shrink-0">
                      {`$${getBookingAmount(item)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}