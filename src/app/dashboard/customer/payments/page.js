"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowRight,
  Receipt,
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

function getTransactionId(booking) {
  if (booking?.transactionId) return booking.transactionId;
  if (booking?.paymentId) return booking.paymentId;
  const rawId = String(booking?._id || booking?.id || "").replace(
    /[^a-zA-Z0-9]/g,
    ""
  );
  if (!rawId) return "pi_FM000000";
  return `pi_${rawId.slice(-10).toUpperCase()}`;
}

export default function CustomerPaymentHistoryPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPaymentHistory = useCallback(async () => {
    setLoading(true);
    setError("");

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
        throw new Error(data?.message || "Failed to load payment history.");
      }

      const allBookings = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      const paidBookings = allBookings.filter(
        (b) => (b?.paymentStatus || "").toString().toLowerCase().trim() === "paid"
      );

      setPayments(paidBookings);
    } catch (err) {
      setError(err.message || "Could not load payment history.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const summary = useMemo(() => {
    const count = payments.length;
    const totalAmount = payments.reduce(
      (sum, item) => sum + getBookingAmount(item),
      0
    );
    return { count, totalAmount };
  }, [payments]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800/90">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Payment history
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          {loading
            ? "Loading your completed payments..."
            : `${summary.count} payments, $${summary.totalAmount} in total.`}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3.5 text-sm text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <p className="font-medium flex-1">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/90 border border-slate-800 rounded-3xl">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-sm">Loading payment history...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            No payments yet
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Once a repair job is completed and paid, your payment receipts will
            appear here.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/customer/bookings"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20"
            >
              <span>Go to My bookings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Service</th>
                    <th className="py-4 px-6">Technician</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Transaction ID</th>
                    <th className="py-4 px-6 text-right">Paid on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {payments.map((item) => {
                    const id = item._id || item.id;
                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="py-4 px-6 font-semibold text-white">
                          {item.serviceTitle || "Repair Service"}
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {item.technicianName || "Technician"}
                        </td>
                        <td className="py-4 px-6 font-bold text-sky-400">
                          ${getBookingAmount(item)}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          {getTransactionId(item)}
                        </td>
                        <td className="py-4 px-6 text-right text-slate-300">
                          {formatShortDate(
                            item.paidAt || item.updatedAt || item.createdAt
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3.5">
            {payments.map((item) => {
              const id = item._id || item.id;
              return (
                <div
                  key={id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-white truncate">
                        {item.serviceTitle || "Repair Service"}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.technicianName || "Technician"}
                      </p>
                    </div>
                    <span className="text-base font-bold text-sky-400 shrink-0">
                      ${getBookingAmount(item)}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5 font-mono text-slate-400 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      {getTransactionId(item)}
                    </span>
                    <span className="text-slate-300 shrink-0">
                      {formatShortDate(
                        item.paidAt || item.updatedAt || item.createdAt
                      )}
                    </span>
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