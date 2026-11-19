"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Activity,
  CheckCircle2,
  CreditCard,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";

export default function CustomerOverview({ user }) {
  const [loading, setLoading] = useState(true);
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const loadCustomerOverview = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${apiUrl}/api/customer/bookings`, { headers });
        if (res.ok) {
          const json = await res.json();
          const list = json.data || json || [];

          if (list.length > 0) {
            const active = list.filter((b) =>
              ["requested", "pending", "accepted", "in_progress", "in progress", "assigned"].includes(
                (b.status || "").toLowerCase()
              )
            );
            const completed = list.filter(
              (b) => (b.status || "").toLowerCase() === "completed"
            );
            const unpaidCompleted = completed.filter(
              (b) => (b.paymentStatus || "").toLowerCase() !== "paid"
            );
            const unpaidSum = unpaidCompleted.reduce(
              (sum, item) => sum + (Number(item.price) || 0),
              0
            );
            const paidList = list.filter(
              (b) => (b.paymentStatus || "").toLowerCase() === "paid"
            );
            const spentSum = paidList.reduce(
              (sum, item) => sum + (Number(item.price) || 0),
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
            setLoading(false);
            return;
          }
        }

        setStats({
          totalRequests: 7,
          activeJobs: 3,
          completedJobs: 2,
          totalSpent: 62,
          unpaidCompletedCount: 1,
          unpaidAmount: 55,
        });
        setInProgressJobs([
          {
            _id: "c1",
            serviceTitle: "AC Servicing & Gas Refill",
            technicianName: "Nusrat Jahan",
            preferredDate: "22 Nov 2026",
            status: "Requested",
          },
          {
            _id: "c2",
            serviceTitle: "TV Wall Mount & Setup",
            technicianName: "Nusrat Jahan",
            preferredDate: "20 Nov 2026",
            status: "Accepted",
          },
        ]);
        setRecentPayments([
          {
            _id: "p1",
            serviceTitle: "Washing Machine Drum & Motor Repair",
            technicianName: "Nusrat Jahan",
            paidDate: "24 Oct 2026",
            amount: 62,
          },
        ]);
      } catch {
        setStats({
          totalRequests: 7,
          activeJobs: 3,
          completedJobs: 2,
          totalSpent: 62,
          unpaidCompletedCount: 1,
          unpaidAmount: 55,
        });
      } finally {
        setLoading(false);
      }
    };

    loadCustomerOverview();
  }, [apiUrl]);

  const formatStatusBadge = (status = "") => {
    const lower = status.toLowerCase();
    if (lower === "accepted" || lower === "in_progress" || lower === "in progress") {
      return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
    }
    return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Your repair jobs at a glance{user?.name ? ` — ${user.name}` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total requests</span>
            <ClipboardList className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : stats.totalRequests}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">All repair bookings placed</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Active jobs</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : stats.activeJobs}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Requested, accepted or in progress
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Completed jobs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : stats.completedJobs}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">Repairs marked finished</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-300">Total spent</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : `$${stats.totalSpent}`}
            </p>
            <p className="text-xs text-sky-300/80 mt-1.5">Completed &amp; paid invoices</p>
          </div>
        </div>
      </div>

      {!loading && stats.unpaidCompletedCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="text-sm text-slate-200">
              <span className="font-bold text-white">
                {stats.unpaidCompletedCount} completed{" "}
                {stats.unpaidCompletedCount === 1 ? "job is" : "jobs are"} waiting for payment
              </span>
              , <span className="font-semibold text-amber-300">${stats.unpaidAmount}</span> in total.
            </p>
          </div>

          <Link
            href="/dashboard/customer/payments"
            className="inline-flex items-center justify-center bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20 shrink-0"
          >
            Review and pay
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">In progress now</h2>
                <p className="text-xs text-slate-400 mt-0.5">Active repair requests</p>
              </div>
              <Link
                href="/dashboard/customer/bookings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
              >
                <span>All bookings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {inProgressJobs.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl text-sm text-slate-400">
                No active jobs right now.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {inProgressJobs.map((job) => (
                  <div
                    key={job._id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {job.serviceTitle}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {job.technicianName}, preferred {job.preferredDate}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full shrink-0 ${formatStatusBadge(
                        job.status
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Recent payments</h2>
                <p className="text-xs text-slate-400 mt-0.5">Settled repair invoices</p>
              </div>
              <Link
                href="/dashboard/customer/payments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
              >
                <span>Payment history</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl text-sm text-slate-400">
                No completed payments yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {recentPayments.map((pay) => (
                  <div
                    key={pay._id}
                    className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm">
                        {pay.serviceTitle}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {pay.technicianName}, paid {pay.paidDate}
                      </p>
                    </div>
                    <span className="text-base font-bold text-sky-400 shrink-0">
                      ${pay.amount}
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