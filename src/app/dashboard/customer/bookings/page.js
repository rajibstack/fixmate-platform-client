"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { DashboardPageSkeleton, FixMateSpinner } from "@/components/ui/LoadingState";

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
  const rawId = String(booking?._id || booking?.id || "");
  if (!rawId) return "#FM-0000";
  const numericTail = rawId
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 9000, 1000);
  return `#FM-${numericTail}`;
}

function normalizeStatus(status) {
  return (status || "requested").toString().toLowerCase().trim();
}

function normalizePaymentStatus(paymentStatus) {
  return (paymentStatus || "unpaid").toString().toLowerCase().trim();
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case "accepted":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "in-progress":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "cancelled":
    case "rejected":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
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

export default function CustomerMyBookingsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchMyBookings = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/bookings/my`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load your bookings.");
      }

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setBookings(list);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not fetch bookings.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const counts = useMemo(() => {
    let active = 0;
    let toPay = 0;
    let paid = 0;
    let closed = 0;

    for (const b of bookings) {
      const st = normalizeStatus(b?.status);
      const pay = normalizePaymentStatus(b?.paymentStatus);

      if (["requested", "accepted", "in-progress"].includes(st)) {
        active += 1;
      }
      if (st === "completed" && pay !== "paid") {
        toPay += 1;
      }
      if (pay === "paid") {
        paid += 1;
      }
      if (["cancelled", "rejected"].includes(st)) {
        closed += 1;
      }
    }

    return {
      all: bookings.length,
      active,
      toPay,
      paid,
      closed,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const st = normalizeStatus(b?.status);
      const pay = normalizePaymentStatus(b?.paymentStatus);

      if (activeTab === "active") {
        return ["requested", "accepted", "in-progress"].includes(st);
      }
      if (activeTab === "to-pay") {
        return st === "completed" && pay !== "paid";
      }
      if (activeTab === "paid") {
        return pay === "paid";
      }
      if (activeTab === "closed") {
        return ["cancelled", "rejected"].includes(st);
      }
      return true;
    });
  }, [bookings, activeTab]);

  const handleCancelRequest = async (booking) => {
    const id = booking._id || booking.id;
    setActionId(id);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to cancel booking request.");
      }

      setBookings((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, status: "cancelled" }
            : item
        )
      );
      setFeedback({
        type: "success",
        message: `Request for "${booking.serviceTitle}" has been cancelled.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not cancel booking request.",
      });
    } finally {
      setActionId(null);
    }
  };

  const handlePayNow = async (booking) => {
    const id = booking._id || booking.id;
    setActionId(id);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/bookings/${id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: Number(
            booking.finalAmount ?? booking.totalPrice ?? booking.startingPrice ?? 0
          ),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Payment could not be completed.");
      }

      setBookings((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, paymentStatus: "paid" }
            : item
        )
      );
      setFeedback({
        type: "success",
        message: `Payment completed for "${booking.serviceTitle}".`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not process payment.",
      });
    } finally {
      setActionId(null);
    }
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "to-pay", label: "To pay", count: counts.toPay },
    { key: "paid", label: "Paid", count: counts.paid },
    { key: "closed", label: "Closed", count: counts.closed },
  ];

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My bookings
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Track each repair from request to payment.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center bg-slate-900/95 border border-slate-800 rounded-xl p-1 gap-1 self-start lg:self-auto">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
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

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3.5 border flex items-start gap-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          )}
          <p className="font-medium flex-1">{feedback.message}</p>
        </div>
      )}

      {/* Bookings List / States */}
      {filteredBookings.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            No bookings found
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            There are no repair bookings under this filter right now.
          </p>
          <div className="pt-2">
            <Link
              href="/services"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20"
            >
              <span>Browse Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const id = booking._id || booking.id;
            const status = normalizeStatus(booking?.status);
            const paymentStatus = normalizePaymentStatus(booking?.paymentStatus);
            const busy = actionId === id;

            const amount = Number(
              booking?.finalAmount ??
                booking?.totalPrice ??
                booking?.startingPrice ??
                booking?.price ??
                0
            );
            const amountLabel =
              status === "completed" ? "Final amount" : "Starting price";

            const canCancel = status === "requested";
            const canPay = status === "completed" && paymentStatus !== "paid";

            return (
              <div
                key={id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 rounded-3xl p-4 sm:p-5 shadow-xl transition flex flex-col xl:flex-row xl:items-stretch justify-between gap-5"
              >
                {/* Left Section: Fixed-Size Thumbnail + Info + Problem Description */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 flex-1 min-w-0">
                  <div className="w-full h-36 sm:w-36 sm:h-28 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    {booking?.serviceImage ? (
                      <img
                        src={booking.serviceImage}
                        alt={booking.serviceTitle}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <Wrench className="w-8 h-8 text-sky-400" />
                    )}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {booking?.serviceTitle || "Repair Service"}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-400 truncate">
                      {booking?.technicianName || "Technician"}
                      {booking?.technicianEmail
                        ? `, ${booking.technicianEmail}`
                        : ""}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
                      <span>
                        Requested{" "}
                        <strong className="font-semibold text-slate-200">
                          {formatShortDate(booking?.createdAt)}
                        </strong>
                      </span>
                      <span>
                        Preferred{" "}
                        <strong className="font-semibold text-slate-200">
                          {formatShortDate(booking?.preferredDate)}
                        </strong>
                      </span>
                    </div>

                    {booking?.problemDescription && (
                      <p className="text-xs sm:text-sm text-slate-300/90 pt-1 leading-relaxed">
                        {booking.problemDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Section: Expanded Leftward, No Top Dash, Side-by-Side Badges & Action */}
                <div className="w-full xl:w-[27rem] xl:pl-6 xl:border-l xl:border-dashed xl:border-slate-800 flex flex-col justify-between gap-4 shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-medium text-slate-400 pt-0.5">
                      Ticket {getTicketCode(booking)}
                    </span>

                    <div className="text-right">
                      <span className="block text-[11px] text-slate-400 leading-tight">
                        {amountLabel}
                      </span>
                      <span className="text-2xl font-bold text-white leading-tight">
                        ${amount}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 shrink-0">
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

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      {canCancel && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleCancelRequest(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {busy ? (
                            <FixMateSpinner compact />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Cancel request</span>
                        </button>
                      )}

                      {canPay && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handlePayNow(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {busy ? (
                            <FixMateSpinner compact />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5" />
                          )}
                          <span>Pay now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}