"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CreditCard,
  DollarSign,
  Loader2,
  Receipt,
  TrendingUp,
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

function formatCurrency(value) {
  const num = Number(value) || 0;
  if (Number.isInteger(num)) {
    return `$${num}`;
  }
  return `$${num.toFixed(2)}`;
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

function getTransactionCode(booking) {
  if (booking?.transactionId) return booking.transactionId;
  const rawId = String(booking?._id || booking?.id || "");
  if (!rawId) return "pi_3FIXMATE0000";
  const suffix = rawId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-10)
    .toUpperCase()
    .padEnd(10, "X");
  return `pi_3${suffix}`;
}

export default function AdminTransactionsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
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
        throw new Error(data?.message || "Failed to load transactions.");
      }

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setBookings(list);
    } catch (err) {
      setError(err.message || "Could not fetch transactions.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const paidTransactions = useMemo(() => {
    return bookings
      .filter(
        (b) => (b?.paymentStatus || "").toString().toLowerCase().trim() === "paid"
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
  }, [bookings]);

  const summary = useMemo(() => {
    const paymentCount = paidTransactions.length;
    const totalRevenue = paidTransactions.reduce(
      (sum, item) => sum + getBookingAmount(item),
      0
    );
    const averageJob = paymentCount > 0 ? totalRevenue / paymentCount : 0;

    return {
      totalRevenue,
      paymentCount,
      averageJob,
    };
  }, [paidTransactions]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-800/90">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Transactions
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          All Stripe payments recorded on FixMate.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3.5 text-sm text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <p className="font-medium flex-1">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
              {loading ? "—" : formatCurrency(summary.totalRevenue)}
            </p>
            <p className="text-xs text-sky-300/80 mt-1.5">
              Settled customer payments
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Payments
            </span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : summary.paymentCount}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Completed &amp; paid repair invoices
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Average job
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : formatCurrency(summary.averageJob)}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Average value per paid job
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table / Cards */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/90 border border-slate-800 rounded-3xl">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-sm">Loading payment transactions...</span>
        </div>
      ) : paidTransactions.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            No transactions yet
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Completed and paid customer repair invoices will appear here.
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
                    <th className="py-4 px-5">Customer</th>
                    <th className="py-4 px-5">Technician</th>
                    <th className="py-4 px-5">Service</th>
                    <th className="py-4 px-5">Amount</th>
                    <th className="py-4 px-5">Transaction ID</th>
                    <th className="py-4 px-5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {paidTransactions.map((tx) => {
                    const id = tx._id || tx.id;
                    return (
                      <tr
                        key={id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="font-semibold text-white">
                            {tx?.customerName || "Customer"}
                          </div>
                          {tx?.customerEmail && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {tx.customerEmail}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-5 text-slate-300 whitespace-nowrap">
                          {tx?.technicianName || "Technician"}
                        </td>
                        <td className="py-4 px-5 font-medium text-white">
                          {tx?.serviceTitle || "Repair Service"}
                        </td>
                        <td className="py-4 px-5 font-bold text-sky-400 whitespace-nowrap">
                          {formatCurrency(getBookingAmount(tx))}
                        </td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {getTransactionCode(tx)}
                        </td>
                        <td className="py-4 px-5 text-right text-slate-300 whitespace-nowrap">
                          {formatShortDate(
                            tx?.paidAt || tx?.updatedAt || tx?.createdAt
                          )}
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
            {paidTransactions.map((tx) => {
              const id = tx._id || tx.id;
              return (
                <div
                  key={id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-white truncate">
                        {tx?.serviceTitle || "Repair Service"}
                      </h2>
                      <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                        {getTransactionCode(tx)}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-sky-400 shrink-0">
                      {formatCurrency(getBookingAmount(tx))}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <strong className="text-slate-200 font-medium">
                        {tx?.customerName || "Customer"}
                      </strong>
                      {tx?.customerEmail && (
                        <span className="text-slate-500 truncate">
                          ({tx.customerEmail})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Wrench className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Technician:{" "}
                        <strong className="text-slate-200 font-medium">
                          {tx?.technicianName || "Technician"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      {formatShortDate(
                        tx?.paidAt || tx?.updatedAt || tx?.createdAt
                      )}
                    </span>
                    <span className="text-emerald-400 font-semibold">Paid</span>
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