"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Activity,
  CheckCircle2,
  CreditCard,
  ArrowUpRight,
  AlertCircle,
  Wrench,
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

function formatStatusLabel(status = "") {
  const lower = status.toString().toLowerCase().trim();
  if (lower === "in-progress" || lower === "in_progress") return "In Progress";
  if (!lower) return "Requested";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function CustomerOverview({ user }) {
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    unpaidCompletedCount: 0,
    unpaidAmount: 0,
  });
  const [inProgressJobs, setInProgressJobs] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const loadCustomerOverview = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res = await fetch(`${apiUrl}/api/bookings/my`, {
        cache: "no-store",
        headers,
      });
      if (res.status === 404) {
        res = await fetch(`${apiUrl}/api/customer/bookings`, {
          cache: "no-store",
          headers,
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || "Failed to load overview data.");
      }

      const list = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      const active = list.filter((b) =>
        [
          "requested",
          "pending",
          "accepted",
          "in-progress",
          "in_progress",
          "in progress",
          "assigned",
        ].includes((b?.status || "").toString().toLowerCase().trim())
      );

      const completed = list.filter(
        (b) => (b?.status || "").toString().toLowerCase().trim() === "completed"
      );

      const unpaidCompleted = completed.filter(
        (b) =>
          (b?.paymentStatus || "").toString().toLowerCase().trim() !== "paid"
      );

      const unpaidSum = unpaidCompleted.reduce(
        (sum, item) => sum + getBookingAmount(item),
        0
      );

      const paidList = list
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

      const spentSum = paidList.reduce(
        (sum, item) => sum + getBookingAmount(item),
        0
      );

      setStats({
        totalRequests: list.length,
        activeJobs: active.length,
        completedJobs: completed.length,
        totalSpent: spentSum,
        unpaidCompletedCount: unpaidCompleted.length,
        unpaidAmount: unpaidSum,
      });

      setInProgressJobs(active.slice(0, 4));
      setRecentPayments(paidList.slice(0, 4));
    } catch (err) {
      setError(err.message || "Could not load your overview.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadCustomerOverview();
  }, [loadCustomerOverview]);

  const formatStatusBadge = (status = "") => {
    const lower = status.toString().toLowerCase().trim();
    if (
      lower === "accepted" ||
      lower === "in-progress" ||
      lower === "in_progress" ||
      lower === "in progress"
    ) {
      return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
    }
    return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  };

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Your repair jobs at a glance{user?.name ? ` — ${user.name}` : ""}.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadCustomerOverview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Total requests
            </span>
            <ClipboardList className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{stats.totalRequests}</p>
            <p className="text-xs text-slate-500 mt-1.5">
              All repair bookings placed
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Active jobs
            </span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{stats.activeJobs}</p>
            <p className="text-xs text-slate-400 mt-1.5">
              Requested, accepted or in progress
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Completed jobs
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {stats.completedJobs}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Repairs marked finished
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-300">
              Total spent
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {`$${stats.totalSpent}`}
            </p>
            <p className="text-xs text-sky-300/80 mt-1.5">
              Completed &amp; paid invoices
            </p>
          </div>
        </div>
      </div>

      {/* Unpaid Completed Job Banner */}
      {stats.unpaidCompletedCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-sm text-slate-200">
              <span className="font-bold text-white">
                {stats.unpaidCompletedCount} completed{" "}
                {stats.unpaidCompletedCount === 1 ? "job is" : "jobs are"}{" "}
                waiting for payment
              </span>
              ,{" "}
              <span className="font-semibold text-amber-300">
                {`$${stats.unpaidAmount}`}
              </span>{" "}
              in total.
            </p>
          </div>

          <Link
            href="/dashboard/customer/bookings"
            onClick={() => setNavigating(true)}
            className="inline-flex items-center justify-center bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20 shrink-0"
          >
            Review and pay
          </Link>
        </div>
      )}

      {/* Bottom Two Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">In progress now</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Active repair requests
                </p>
              </div>
              <Link
                href="/dashboard/customer/bookings"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
              >
                <span>All bookings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {inProgressJobs.length === 0 ? (
              <div className="py-10 px-5 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center mx-auto">
                  <Wrench className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-400">
                  No active jobs right now.
                </p>
                <Link
                  href="/services"
                  onClick={() => setNavigating(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition shadow-md shadow-sky-500/15"
                >
                  <span>Browse services</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {inProgressJobs.map((job) => (
                  <div
                    key={job._id || job.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">
                        {job.serviceTitle || "Repair Service"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {job.technicianName || "Technician"}, preferred{" "}
                        {formatShortDate(job.preferredDate)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full shrink-0 ${formatStatusBadge(
                        job.status
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {formatStatusLabel(job.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Recent payments</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Settled repair invoices
                </p>
              </div>
              <Link
                href="/dashboard/customer/payments"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
              >
                <span>Payment history</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="py-10 px-5 text-center border border-dashed border-slate-800 rounded-2xl space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center mx-auto">
                  <CreditCard className="w-5 h-5" />
                </div>
                <p className="text-sm text-slate-400">
                  No completed payments yet.
                </p>
                <Link
                  href="/dashboard/customer/bookings"
                  onClick={() => setNavigating(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition"
                >
                  <span>View bookings</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentPayments.map((pay) => (
                  <div
                    key={pay._id || pay.id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">
                        {pay.serviceTitle || "Repair Service"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {pay.technicianName || "Technician"}, paid{" "}
                        {formatShortDate(
                          pay.paidAt || pay.updatedAt || pay.createdAt
                        )}
                      </p>
                    </div>
                    <span className="text-base font-bold text-sky-400 shrink-0">
                      {`$${getBookingAmount(pay)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}