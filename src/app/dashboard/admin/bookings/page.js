"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  RefreshCw,
  RotateCcw,
  User,
  Wrench,
} from "lucide-react";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

const TIMELINE_STEPS = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "paid", label: "Paid" },
];

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

function formatTimelineTimestamp(dateValue) {
  if (!dateValue) return "";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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

function normalizeStatus(status) {
  const normalized = (status || "requested")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/_/g, "-");
  if (normalized === "pending") return "requested";
  if (normalized === "in progress") return "in-progress";
  return normalized;
}

function normalizePaymentStatus(paymentStatus) {
  return (paymentStatus || "unpaid").toString().toLowerCase().trim();
}

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

function getStatusBadgeStyle(status) {
  switch (status) {
    case "accepted":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
    case "in-progress":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "rejected":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
    case "cancelled":
      return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
    case "requested":
    default:
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
  }
}

function formatStatusText(status) {
  if (status === "in-progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getPaymentBadgeStyle(paymentStatus) {
  if (paymentStatus === "paid") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  }
  return "bg-slate-200/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
}

function formatPaymentText(paymentStatus) {
  return paymentStatus === "paid" ? "Paid" : "Unpaid";
}

function buildTimelineState(booking) {
  const status = normalizeStatus(booking?.status);
  const paymentStatus = normalizePaymentStatus(booking?.paymentStatus);
  const rawHistory = Array.isArray(booking?.statusHistory)
    ? booking.statusHistory
    : [];

  const historyMap = new Map();
  for (const item of rawHistory) {
    if (!item) continue;
    const stepKey = normalizeStatus(
      typeof item === "string" ? item : item.status
    );
    if (!stepKey) continue;
    historyMap.set(stepKey, item?.changedAt || item?.timestamp || null);
  }

  if (!historyMap.has("requested")) {
    historyMap.set("requested", booking?.createdAt || null);
  }

  if (paymentStatus === "paid" && !historyMap.has("paid")) {
    historyMap.set("paid", booking?.paidAt || booking?.updatedAt || null);
  }

  const isClosed = status === "cancelled" || status === "rejected";
  let highestReachedIndex = -1;

  if (paymentStatus === "paid") {
    highestReachedIndex = 4;
  } else if (status === "completed") {
    highestReachedIndex = 3;
  } else if (status === "in-progress") {
    highestReachedIndex = 2;
  } else if (status === "accepted") {
    highestReachedIndex = 1;
  } else if (status === "requested") {
    highestReachedIndex = 0;
  }

  for (let i = 0; i < TIMELINE_STEPS.length; i++) {
    if (historyMap.has(TIMELINE_STEPS[i].key) && i > highestReachedIndex) {
      highestReachedIndex = i;
    }
  }

  const activeStepIndex = isClosed
    ? -1
    : paymentStatus === "paid"
    ? 4
    : highestReachedIndex;

  return {
    isClosed,
    closedStatus: status,
    closedAt: historyMap.get(status) || booking?.updatedAt || null,
    activeStepIndex,
    steps: TIMELINE_STEPS.map((step, idx) => {
      const hasHistoryEntry = historyMap.has(step.key);
      const isCompleted =
        !isClosed &&
        (idx < activeStepIndex || (idx === 4 && paymentStatus === "paid"));
      const isCurrent =
        !isClosed &&
        idx === activeStepIndex &&
        !(idx === 4 && paymentStatus === "paid");
      const isReached = isCompleted || isCurrent || hasHistoryEntry;

      return {
        ...step,
        isCompleted,
        isCurrent,
        isReached,
        changedAt: historyMap.get(step.key) || null,
      };
    }),
  };
}

function JobTimelineTracker({ booking, compact = false }) {
  const timeline = useMemo(() => buildTimelineState(booking), [booking]);

  return (
    <div
      className={`${
        compact ? "mt-2 pt-2.5" : "mt-3 pt-3"
      } border-t border-slate-200 dark:border-slate-800/80 space-y-2`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Job Timeline
        </span>

        {timeline.isClosed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
            <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>
              {formatStatusText(timeline.closedStatus)}
              {timeline.closedAt
                ? ` • ${formatTimelineTimestamp(timeline.closedAt)}`
                : ""}
            </span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Step {Math.min(timeline.activeStepIndex + 1, 5)} of{" "}
            {TIMELINE_STEPS.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {timeline.steps.map((step, index) => {
          const timestampLabel = formatTimelineTimestamp(step.changedAt);

          let cardStyle =
            "bg-slate-100/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-500";
          if (step.isCompleted) {
            cardStyle =
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-200";
          } else if (step.isCurrent) {
            cardStyle =
              "bg-sky-500/15 border-sky-400/50 text-sky-700 dark:text-sky-200";
          }

          return (
            <div
              key={step.key}
              className={`rounded-xl border px-2 py-1.5 transition ${cardStyle}`}
            >
              <div className="flex items-center gap-1.5">
                {step.isCompleted ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : step.isCurrent ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-sky-400/20 border border-sky-400 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 text-[9px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                )}

                <span className="text-[11px] font-semibold truncate">
                  {step.label}
                </span>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 pl-5 truncate">
                {timestampLabel || (step.isReached ? "Recorded" : "Pending")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
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

function buildUserLookup(users = [], currentUser = null) {
  const byId = new Map();
  const byEmail = new Map();

  const allUsers = Array.isArray(users) ? [...users] : [];
  if (currentUser && typeof currentUser === "object") {
    allUsers.push(currentUser);
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

function resolveCustomerName(booking, lookup) {
  const id = String(
    booking?.customerId || booking?.userId || booking?.customer?._id || ""
  ).trim();
  const email = String(
    booking?.customerEmail ||
      booking?.userEmail ||
      booking?.customer?.email ||
      ""
  )
    .trim()
    .toLowerCase();

  const matched =
    (id && lookup?.byId?.get(id)) || (email && lookup?.byEmail?.get(email));

  return (
    matched?.name ||
    booking?.customer?.name ||
    booking?.customerName ||
    booking?.userName ||
    "Customer"
  );
}

function resolveTechnicianName(booking, lookup) {
  const id = String(
    booking?.technicianId || booking?.technician?._id || ""
  ).trim();
  const email = String(
    booking?.technicianEmail || booking?.technician?.email || ""
  )
    .trim()
    .toLowerCase();

  const matched =
    (id && lookup?.byId?.get(id)) || (email && lookup?.byEmail?.get(email));

  return (
    matched?.name ||
    booking?.technician?.name ||
    booking?.technicianName ||
    "Technician"
  );
}

export default function AdminAllBookingsPage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAllBookings = useCallback(
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
        if (!token) {
          throw new Error(
            "Please sign in as an admin to view all platform bookings."
          );
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [bookingsRes, usersRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/bookings`, {
            cache: "no-store",
            headers,
          }),
          fetch(`${apiUrl}/api/admin/users`, {
            cache: "no-store",
            headers,
          }).catch(() => null),
        ]);

        const data = await bookingsRes.json().catch(() => ({}));
        if (!bookingsRes.ok) {
          throw new Error(data?.message || "Failed to load platform bookings.");
        }

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setBookings(list);

        if (usersRes && usersRes.ok) {
          const usersData = await usersRes.json().catch(() => ({}));
          const userList = Array.isArray(usersData?.data)
            ? usersData.data
            : Array.isArray(usersData)
            ? usersData
            : [];
          if (userList.length > 0) {
            setUsers(userList);
          }
        }
      } catch (err) {
        if (!silent) {
          setError(err.message || "Could not fetch bookings.");
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
    setCurrentUser(readStoredUser());
    fetchAllBookings();

    const handleLiveSync = () => {
      setCurrentUser(readStoredUser());
      fetchAllBookings({ silent: true });
    };

    window.addEventListener("auth-change", handleLiveSync);
    window.addEventListener("storage", handleLiveSync);
    window.addEventListener("bookings-updated", handleLiveSync);
    return () => {
      window.removeEventListener("auth-change", handleLiveSync);
      window.removeEventListener("storage", handleLiveSync);
      window.removeEventListener("bookings-updated", handleLiveSync);
    };
  }, [fetchAllBookings]);

  const userLookup = useMemo(
    () => buildUserLookup(users, currentUser),
    [users, currentUser]
  );

  const counts = useMemo(() => {
    let requested = 0;
    let accepted = 0;
    let inProgress = 0;
    let completed = 0;
    let rejected = 0;
    let cancelled = 0;

    for (const item of bookings) {
      const st = normalizeStatus(item?.status);
      if (st === "requested") requested += 1;
      else if (st === "accepted") accepted += 1;
      else if (st === "in-progress") inProgress += 1;
      else if (st === "completed") completed += 1;
      else if (st === "rejected") rejected += 1;
      else if (st === "cancelled") cancelled += 1;
    }

    return {
      all: bookings.length,
      requested,
      accepted,
      inProgress,
      completed,
      rejected,
      cancelled,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (activeTab === "all") return bookings;
    return bookings.filter(
      (item) => normalizeStatus(item?.status) === activeTab
    );
  }, [bookings, activeTab]);

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "requested", label: "Requested", count: counts.requested },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "in-progress", label: "In progress", count: counts.inProgress },
    { key: "completed", label: "Completed", count: counts.completed },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Filter Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            All bookings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            Every repair job on the platform. Read only.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 self-start xl:self-auto shadow-xs dark:shadow-none">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                  active
                    ? "bg-sky-500 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs ${
                    active
                      ? "text-slate-950/80 font-bold"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
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
            onClick={() => fetchAllBookings()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Bookings Table / Cards */}
      {filteredBookings.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-md dark:shadow-none">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === "all" ? "No bookings yet" : "No bookings found"}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {activeTab === "all"
              ? "There are no repair jobs recorded on the platform yet."
              : "There are no repair jobs matching this status filter."}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {activeTab !== "all" ? (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Show all bookings</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fetchAllBookings()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Refresh bookings</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-5">Ticket</th>
                    <th className="py-4 px-5">Service</th>
                    <th className="py-4 px-5">Customer</th>
                    <th className="py-4 px-5">Technician</th>
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Payment</th>
                    <th className="py-4 px-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm">
                  {filteredBookings.map((booking) => {
                    const id = booking._id || booking.id;
                    const status = normalizeStatus(booking?.status);
                    const paymentStatus = normalizePaymentStatus(
                      booking?.paymentStatus
                    );
                    const customerName = resolveCustomerName(
                      booking,
                      userLookup
                    );
                    const technicianName = resolveTechnicianName(
                      booking,
                      userLookup
                    );

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-4 px-5 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap align-top">
                          {getTicketCode(booking)}
                        </td>
                        <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white align-top">
                          <div>{booking?.serviceTitle || "Repair Service"}</div>
                          <JobTimelineTracker booking={booking} compact />
                        </td>
                        <td className="py-4 px-5 text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          {customerName}
                        </td>
                        <td className="py-4 px-5 text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          {technicianName}
                        </td>
                        <td className="py-4 px-5 text-slate-700 dark:text-slate-300 whitespace-nowrap align-top">
                          {formatShortDate(
                            booking?.preferredDate || booking?.createdAt
                          )}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                              status
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {formatStatusText(status)}
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap align-top">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentBadgeStyle(
                              paymentStatus
                            )}`}
                          >
                            {paymentStatus === "paid" && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {formatPaymentText(paymentStatus)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap align-top">
                          ${getBookingAmount(booking)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Card View */}
          <div className="lg:hidden space-y-3.5">
            {filteredBookings.map((booking) => {
              const id = booking._id || booking.id;
              const status = normalizeStatus(booking?.status);
              const paymentStatus = normalizePaymentStatus(
                booking?.paymentStatus
              );
              const customerName = resolveCustomerName(booking, userLookup);
              const technicianName = resolveTechnicianName(
                booking,
                userLookup
              );

              return (
                <div
                  key={id}
                  className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md dark:shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {getTicketCode(booking)}
                      </span>
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                        {booking?.serviceTitle || "Repair Service"}
                      </h2>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white shrink-0">
                      ${getBookingAmount(booking)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      Customer:{" "}
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">
                        {customerName}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Wrench className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      Tech:{" "}
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">
                        {technicianName}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      Date:{" "}
                      <strong className="text-slate-800 dark:text-slate-200 font-medium">
                        {formatShortDate(
                          booking?.preferredDate || booking?.createdAt
                        )}
                      </strong>
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                          status
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {formatStatusText(status)}
                      </span>

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentBadgeStyle(
                          paymentStatus
                        )}`}
                      >
                        {formatPaymentText(paymentStatus)}
                      </span>
                    </div>
                  </div>

                  <JobTimelineTracker booking={booking} compact />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}