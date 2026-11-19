"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Loader2,
  User,
  Wrench,
} from "lucide-react";

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

function normalizeStatus(status) {
  const normalized = (status || "requested")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/_/g, "-");
  if (normalized === "pending") return "requested";
  return normalized;
}

function normalizePaymentStatus(paymentStatus) {
  return (paymentStatus || "unpaid").toString().toLowerCase().trim();
}

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

function getStatusBadgeStyle(status) {
  switch (status) {
    case "accepted":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "in-progress":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "rejected":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    case "cancelled":
      return "bg-slate-800 text-slate-300 border-slate-700";
    case "requested":
    default:
      return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
  }
}

function formatStatusText(status) {
  if (status === "in-progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getPaymentBadgeStyle(paymentStatus) {
  if (paymentStatus === "paid") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
  return "bg-slate-800/90 text-slate-300 border-slate-700";
}

function formatPaymentText(paymentStatus) {
  return paymentStatus === "paid" ? "Paid" : "Unpaid";
}

export default function AdminAllBookingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAllBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/admin/bookings`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load platform bookings.");
      }

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setBookings(list);
    } catch (err) {
      setError(err.message || "Could not fetch bookings.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAllBookings();
  }, [fetchAllBookings]);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Filter Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            All bookings
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Every repair job on the platform. Read only.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center bg-slate-900/95 border border-slate-800 rounded-xl p-1 gap-1 self-start xl:self-auto">
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
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs ${
                    active ? "text-slate-950/80 font-bold" : "text-slate-400"
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
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3.5 text-sm text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <p className="font-medium flex-1">{error}</p>
        </div>
      )}

      {/* Bookings Table / Cards */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/90 border border-slate-800 rounded-3xl">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-sm">Loading platform bookings...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            No bookings found
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            There are no repair jobs matching this status filter.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
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
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {filteredBookings.map((booking) => {
                    const id = booking._id || booking.id;
                    const status = normalizeStatus(booking?.status);
                    const paymentStatus = normalizePaymentStatus(
                      booking?.paymentStatus
                    );

                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="py-4 px-5 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {getTicketCode(booking)}
                        </td>
                        <td className="py-4 px-5 font-semibold text-white">
                          {booking?.serviceTitle || "Repair Service"}
                        </td>
                        <td className="py-4 px-5 text-slate-300 whitespace-nowrap">
                          {booking?.customerName || "Customer"}
                        </td>
                        <td className="py-4 px-5 text-slate-300 whitespace-nowrap">
                          {booking?.technicianName || "Technician"}
                        </td>
                        <td className="py-4 px-5 text-slate-300 whitespace-nowrap">
                          {formatShortDate(
                            booking?.preferredDate || booking?.createdAt
                          )}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                              status
                            )}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {formatStatusText(status)}
                          </span>
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentBadgeStyle(
                              paymentStatus
                            )}`}
                          >
                            {paymentStatus === "paid" && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            )}
                            {formatPaymentText(paymentStatus)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-white whitespace-nowrap">
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

              return (
                <div
                  key={id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono text-slate-400">
                        {getTicketCode(booking)}
                      </span>
                      <h2 className="text-sm sm:text-base font-bold text-white truncate">
                        {booking?.serviceTitle || "Repair Service"}
                      </h2>
                    </div>
                    <span className="text-base sm:text-lg font-bold text-white shrink-0">
                      ${getBookingAmount(booking)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      Customer:{" "}
                      <strong className="text-slate-200 font-medium">
                        {booking?.customerName || "Customer"}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Wrench className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      Tech:{" "}
                      <strong className="text-slate-200 font-medium">
                        {booking?.technicianName || "Technician"}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      Date:{" "}
                      <strong className="text-slate-200 font-medium">
                        {formatShortDate(
                          booking?.preferredDate || booking?.createdAt
                        )}
                      </strong>
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
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
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}