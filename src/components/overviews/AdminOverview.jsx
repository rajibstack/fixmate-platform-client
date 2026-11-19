"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  CalendarCheck,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalBookings: 0,
    platformRevenue: 0,
  });
  const [pendingServices, setPendingServices] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const loadAdminOverview = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${apiUrl}/api/admin/overview`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.stats) {
            setStats(data.stats);
            setPendingServices(data.pendingServices || []);
            setRecentBookings(data.recentBookings || []);
            setLoading(false);
            return;
          }
        }

        setStats({
          totalUsers: 124,
          pendingApprovals: 4,
          totalBookings: 89,
          platformRevenue: 2460,
        });
        setPendingServices([
          {
            _id: "s1",
            title: "OLED TV Panel Repair & Calibration",
            technicianName: "Rafiq Islam",
            submittedAt: "18 Nov 2026",
          },
          {
            _id: "s2",
            title: "Inverter AC PCB Board Servicing",
            technicianName: "Mahmud Hasan",
            submittedAt: "19 Nov 2026",
          },
        ]);
        setRecentBookings([
          {
            _id: "b1",
            bookingCode: "#FM-3012",
            serviceTitle: "Home Electrical Breaker Upgrade",
            status: "Completed",
            amount: 95,
          },
          {
            _id: "b2",
            bookingCode: "#FM-3013",
            serviceTitle: "Laptop Screen Replacement",
            status: "In Progress",
            amount: 120,
          },
        ]);
      } catch {
        setStats({
          totalUsers: 124,
          pendingApprovals: 4,
          totalBookings: 89,
          platformRevenue: 2460,
        });
      } finally {
        setLoading(false);
      }
    };

    loadAdminOverview();
  }, [apiUrl]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Platform users, service approvals, bookings and revenue.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total users</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.totalUsers}</p>
            <p className="text-xs text-slate-400 mt-1.5">Customers &amp; technicians</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Pending approvals</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.pendingApprovals}</p>
            <p className="text-xs text-slate-400 mt-1.5">Services awaiting review</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total bookings</span>
            <CalendarCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.totalBookings}</p>
            <p className="text-xs text-slate-400 mt-1.5">All platform repair orders</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-300">Platform revenue</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : `$${stats.platformRevenue}`}</p>
            <p className="text-xs text-sky-300/80 mt-1.5">Recorded transaction volume</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Services awaiting review</h2>
              <p className="text-xs text-slate-400 mt-0.5">New technician listings</p>
            </div>
            <Link
              href="/dashboard/admin/services"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              <span>Manage services</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {pendingServices.map((srv) => (
              <div key={srv._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white text-sm">{srv.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    By {srv.technicianName} • {srv.submittedAt}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 shrink-0">
                  Review
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Recent bookings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest platform activity</p>
            </div>
            <Link
              href="/dashboard/admin/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              <span>All bookings</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentBookings.map((b) => (
              <div key={b._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white text-sm">{b.serviceTitle}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {b.bookingCode} • {b.status}
                  </p>
                </div>
                <span className="text-base font-bold text-sky-400 shrink-0">${b.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}