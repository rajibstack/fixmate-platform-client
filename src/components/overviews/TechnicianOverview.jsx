"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

export default function TechnicianOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServices: 0,
    approvedServices: 0,
    pendingReviewServices: 0,
    pendingRequests: 0,
    totalEarnings: 0,
  });
  const [newRequests, setNewRequests] = useState([]);
  const [recentEarnings, setRecentEarnings] = useState([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchTechnicianData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [servicesRes, bookingsRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/technician/services`, { headers }),
          fetch(`${apiUrl}/api/technician/bookings`, { headers }),
        ]);

        let servicesList = [];
        if (servicesRes.status === "fulfilled" && servicesRes.value.ok) {
          const sData = await servicesRes.value.json();
          servicesList = sData.data || sData || [];
        }

        let bookingsList = [];
        if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
          const bData = await bookingsRes.value.json();
          bookingsList = bData.data || bData || [];
        }

        if (servicesList.length > 0 || bookingsList.length > 0) {
          const approved = servicesList.filter((s) => s.status === "approved" || s.isApproved).length;
          const underReview = servicesList.filter((s) => s.status === "pending" || !s.isApproved).length;
          const pendingJobs = bookingsList.filter((b) => b.status === "pending");
          const paidJobs = bookingsList.filter((b) => b.paymentStatus === "paid");
          const earningsSum = paidJobs.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

          setStats({
            totalServices: servicesList.length,
            approvedServices: approved,
            pendingReviewServices: underReview,
            pendingRequests: pendingJobs.length,
            totalEarnings: earningsSum,
          });
          setNewRequests(pendingJobs.slice(0, 4));
          setRecentEarnings(paidJobs.slice(0, 4));
        } else {
          setStats({
            totalServices: 8,
            approvedServices: 6,
            pendingReviewServices: 1,
            pendingRequests: 2,
            totalEarnings: 38,
          });
          setNewRequests([
            {
              _id: "1",
              bookingCode: "#FM-1051",
              serviceTitle: "Phone Battery Replacement",
              customerName: "Sadia Rahman",
              preferredDate: "19 Nov 2026",
            },
            {
              _id: "2",
              bookingCode: "#FM-1052",
              serviceTitle: "Laptop Motherboard Diagnosis & Repair",
              customerName: "Tanvir Hasan",
              preferredDate: "21 Nov 2026",
            },
          ]);
          setRecentEarnings([
            {
              _id: "e1",
              serviceTitle: "House Wiring Fault Finding",
              customerName: "Tanvir Hasan",
              paidDate: "28 Sept 2026",
              amount: 38,
            },
          ]);
        }
      } catch {
        setStats({
          totalServices: 8,
          approvedServices: 6,
          pendingReviewServices: 1,
          pendingRequests: 2,
          totalEarnings: 38,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicianData();
  }, [apiUrl]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Your services, jobs and earnings.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Total services</span>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.totalServices}</p>
            <p className="text-xs text-slate-500 mt-1.5">Listed under your profile</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Approved services</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.approvedServices}</p>
            <p className="text-xs text-slate-400 mt-1.5">
              {stats.pendingReviewServices} waiting for review
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Pending requests</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : stats.pendingRequests}</p>
            <p className="text-xs text-slate-400 mt-1.5">Waiting for you to accept or decline</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-300">Total earnings</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">{loading ? "—" : `$${stats.totalEarnings}`}</p>
            <p className="text-xs text-sky-300/80 mt-1.5">Completed &amp; settled payouts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">New requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">Incoming repair bookings</p>
            </div>
            <Link
              href="/dashboard/technician/requests"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              <span>Manage requests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {newRequests.map((req) => (
              <div key={req._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white text-sm">{req.serviceTitle}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <span>{req.customerName},</span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3 h-3 text-sky-400" />
                      preferred {req.preferredDate}
                    </span>
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 shrink-0">
                  {req.bookingCode}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Recent earnings</h2>
            <p className="text-xs text-slate-400 mt-0.5">Jobs customers have paid for</p>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentEarnings.map((item) => (
              <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white text-sm">{item.serviceTitle}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.customerName}, {item.paidDate}
                  </p>
                </div>
                <span className="text-base font-bold text-sky-400 shrink-0">${item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}