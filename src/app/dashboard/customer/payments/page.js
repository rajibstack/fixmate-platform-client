"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  AlertCircle,
  ArrowRight,
  Receipt,
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

function resolveTechnicianName(record, lookup) {
  const id = String(
    record?.technicianId || record?.technician?._id || ""
  ).trim();
  const email = String(
    record?.technicianEmail || record?.technician?.email || ""
  )
    .trim()
    .toLowerCase();

  const matched =
    (id && lookup?.byId?.get(id)) || (email && lookup?.byEmail?.get(email));

  return (
    matched?.name ||
    record?.technician?.name ||
    record?.technicianName ||
    "Technician"
  );
}

export default function CustomerPaymentHistoryPage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");

  const fetchPaymentHistory = useCallback(
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
          throw new Error("Please sign in to view your payment history.");
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [res, usersRes] = await Promise.all([
          fetch(`${apiUrl}/api/bookings/my`, {
            cache: "no-store",
            headers,
          }),
          fetch(`${apiUrl}/api/admin/users`, {
            cache: "no-store",
            headers,
          }).catch(() => null),
        ]);

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
          (b) =>
            (b?.paymentStatus || "").toString().toLowerCase().trim() === "paid"
        );

        setPayments(paidBookings);

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
          setError(err.message || "Could not load payment history.");
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
    fetchPaymentHistory();

    const handleLiveSync = () => {
      setCurrentUser(readStoredUser());
      fetchPaymentHistory({ silent: true });
    };

    window.addEventListener("auth-change", handleLiveSync);
    window.addEventListener("storage", handleLiveSync);
    return () => {
      window.removeEventListener("auth-change", handleLiveSync);
      window.removeEventListener("storage", handleLiveSync);
    };
  }, [fetchPaymentHistory]);

  const userLookup = useMemo(
    () => buildUserLookup(users, currentUser),
    [users, currentUser]
  );

  const summary = useMemo(() => {
    const count = payments.length;
    const totalAmount = payments.reduce(
      (sum, item) => sum + getBookingAmount(item),
      0
    );
    return { count, totalAmount };
  }, [payments]);

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-slate-800/90 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Payment history
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
          {`${summary.count} payments, $${summary.totalAmount} in total.`}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3.5 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <p className="font-medium flex-1">{error}</p>
        </div>
      )}

      {/* Content */}
      {payments.length === 0 ? (
        <div className="py-16 px-6 text-center bg-gradient-to-tl from-sky-500/15 via-sky-500/[0.04] to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/25 dark:border-slate-800 rounded-3xl space-y-3 shadow-md dark:shadow-none">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            No payments yet
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Once a repair job is completed and paid, your payment receipts will
            appear here.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/customer/booking"
              onClick={() => setNavigating(true)}
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
          <div className="hidden md:block bg-gradient-to-tl from-sky-500/10 via-sky-500/[0.03] to-white dark:from-sky-500/15 dark:via-slate-900 dark:to-slate-900 border border-sky-500/25 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md dark:shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sky-500/15 dark:border-slate-800 bg-sky-500/[0.04] dark:bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-4 px-6">Service</th>
                    <th className="py-4 px-6">Technician</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Transaction ID</th>
                    <th className="py-4 px-6 text-right">Paid on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-500/15 dark:divide-slate-800/80 text-sm">
                  {payments.map((item) => {
                    const id = item._id || item.id;
                    const techName = resolveTechnicianName(item, userLookup);
                    return (
                      <tr
                        key={id}
                        className="hover:bg-sky-500/[0.05] dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                          {item.serviceTitle || "Repair Service"}
                        </td>
                        <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                          {techName}
                        </td>
                        <td className="py-4 px-6 font-bold text-sky-600 dark:text-sky-400">
                          ${getBookingAmount(item)}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {getTransactionId(item)}
                        </td>
                        <td className="py-4 px-6 text-right text-slate-700 dark:text-slate-300">
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
              const techName = resolveTechnicianName(item, userLookup);
              return (
                <div
                  key={id}
                  className="bg-gradient-to-tl from-sky-500/15 via-sky-500/[0.04] to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/25 hover:border-sky-500/45 dark:border-slate-800 rounded-2xl p-4 shadow-md dark:shadow-lg space-y-3 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.serviceTitle || "Repair Service"}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {techName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-bold text-sky-600 dark:text-sky-400 block">
                        ${getBookingAmount(item)}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Paid
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-sky-500/15 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400 truncate">
                      <CreditCard className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      {getTransactionId(item)}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 shrink-0">
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