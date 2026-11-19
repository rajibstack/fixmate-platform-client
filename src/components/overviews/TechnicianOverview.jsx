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
  Loader2,
  Inbox,
  Wallet,
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

function getBookingAmount(booking) {
  const rawAmount =
    booking?.finalAmount ??
    booking?.totalPrice ??
    booking?.startingPrice ??
    booking?.price ??
    0;
  const num = Number(rawAmount);
  return Number.isNaN(num) ? 0 : num;
}

export default function TechnicianOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    let active = true;

    const fetchTechnicianData = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [servicesRes, bookingsRes] = await Promise.allSettled([
          fetch(`${apiUrl}/api/technician/services`, { headers }),
          fetch(`${apiUrl}/api/technician/bookings`, { headers }),
        ]);

        let servicesList = [];
        if (servicesRes.status === "fulfilled") {
          const sData = await servicesRes.value.json().catch(() => ({}));
          if (servicesRes.value.ok) {
            servicesList = Array.isArray(sData?.data)
              ? sData.data
              : Array.isArray(sData)
              ? sData
              : [];
          } else if (active) {
            setError(sData?.message || "Could not load your services.");
          }
        }

        let bookingsList = [];
        if (bookingsRes.status === "fulfilled") {
          const bData = await bookingsRes.value.json().catch(() => ({}));
          if (bookingsRes.value.ok) {
            bookingsList = Array.isArray(bData?.data)
              ? bData.data
              : Array.isArray(bData)
              ? bData
              : [];
          } else if (active && !error) {
            setError(bData?.message || "Could not load your bookings.");
          }
        }

        if (!active) return;

        const approvedCount = servicesList.filter(
          (s) => (s?.status || "").toString().toLowerCase() === "approved"
        ).length;

        const pendingReviewCount = servicesList.filter(
          (s) => (s?.status || "").toString().toLowerCase() === "pending"
        ).length;

        const requestedBookings = bookingsList.filter(
          (b) => (b?.status || "").toString().toLowerCase() === "requested"
        );

        const paidBookings = bookingsList.filter(
          (b) =>
            (b?.paymentStatus || "").toString().toLowerCase() === "paid"
        );

        const earningsSum = paidBookings.reduce(
          (acc, item) => acc + getBookingAmount(item),
          0
        );

        setStats({
          totalServices: servicesList.length,
          approvedServices: approvedCount,
          pendingReviewServices: pendingReviewCount,
          pendingRequests: requestedBookings.length,
          totalEarnings: earningsSum,
        });

        setNewRequests(requestedBookings.slice(0, 4));
        setRecentEarnings(paidBookings.slice(0, 4));
      } catch {
        if (active) {
          setError("Network error while loading technician overview.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchTechnicianData();

    return () => {
      active = false;
    };
  }, [apiUrl]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Your services, jobs and earnings.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Total services
            </span>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : stats.totalServices}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Listed under your profile
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Approved services
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : stats.approvedServices}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              {loading
                ? "Checking review status..."
                : `${stats.pendingReviewServices} waiting for review`}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">
              Pending requests
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : stats.pendingRequests}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">
              Waiting for you to accept or decline
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 border border-sky-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-sky-500/5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-sky-300">
              Total earnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-white">
              {loading ? "—" : `$${stats.totalEarnings}`}
            </p>
            <p className="text-xs text-sky-300/80 mt-1.5">
              Completed &amp; settled payouts
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Requests */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">New requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Incoming repair bookings
              </p>
            </div>
            <Link
              href="/dashboard/technician/requests"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              <span>Manage requests</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Loading requests...</span>
            </div>
          ) : newRequests.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Inbox className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                No pending requests
              </p>
              <p className="text-xs text-slate-500">
                New customer repair requests will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {newRequests.map((req) => (
                <div
                  key={req._id || req.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {req.serviceTitle || "Repair Service"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
                      <span>{req.customerName || "Customer"},</span>
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Calendar className="w-3 h-3 text-sky-400" />
                        preferred {formatShortDate(req.preferredDate)}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 shrink-0">
                    {getTicketCode(req)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Earnings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Recent earnings</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Jobs customers have paid for
            </p>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Loading earnings...</span>
            </div>
          ) : recentEarnings.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Wallet className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                No settled earnings yet
              </p>
              <p className="text-xs text-slate-500">
                Paid completed repairs will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentEarnings.map((item) => (
                <div
                  key={item._id || item.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {item.serviceTitle || "Repair Service"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.customerName || "Customer"},{" "}
                      {formatShortDate(item.updatedAt || item.createdAt)}
                    </p>
                  </div>
                  <span className="text-base font-bold text-sky-400 shrink-0">
                    ${getBookingAmount(item)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}