"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Inbox,
  XCircle,
  Check,
  Play,
  CheckCheck,
  Wrench,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
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

function getStatusBadgeStyle(status) {
  switch (status) {
    case "accepted":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "in-progress":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "rejected":
    case "cancelled":
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

export default function TechnicianManageRequestsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [feedback, setFeedback] = useState(null);

  const fetchTechnicianRequests = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/technician/bookings`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load repair requests.");
      }

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setRequests(list);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not fetch requests.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchTechnicianRequests();
  }, [fetchTechnicianRequests]);

  const counts = useMemo(() => {
    let requested = 0;
    let accepted = 0;
    let inProgress = 0;
    let completed = 0;

    for (const item of requests) {
      const st = normalizeStatus(item?.status);
      if (st === "requested") requested += 1;
      else if (st === "accepted") accepted += 1;
      else if (st === "in-progress") inProgress += 1;
      else if (st === "completed") completed += 1;
    }

    return {
      all: requests.length,
      requested,
      accepted,
      inProgress,
      completed,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const st = normalizeStatus(item?.status);
      if (activeTab === "requested") return st === "requested";
      if (activeTab === "accepted") return st === "accepted";
      if (activeTab === "in-progress") return st === "in-progress";
      if (activeTab === "completed") return st === "completed";
      return true;
    });
  }, [requests, activeTab]);

  const handleStatusChange = async (booking, nextStatus) => {
    const id = booking._id || booking.id;
    const key = `${id}:${nextStatus}`;
    setActionKey(key);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update request status.");
      }

      setRequests((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, status: nextStatus }
            : item
        )
      );

      const successMsg = `"${booking.serviceTitle}" moved to ${formatStatusText(
        nextStatus
      )}.`;
      setFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success(successMsg);
    } catch (err) {
      const errMsg = err.message || "Could not update request status.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setActionKey("");
    }
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "requested", label: "Requested", count: counts.requested },
    { key: "accepted", label: "Accepted", count: counts.accepted },
    { key: "in-progress", label: "In progress", count: counts.inProgress },
    { key: "completed", label: "Completed", count: counts.completed },
  ];

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Manage requests
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Move each job forward one step at a time.
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

      {/* Requests List / States */}
      {filteredRequests.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            {activeTab === "all"
              ? "No repair requests yet"
              : "No repair requests found"}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {activeTab === "all"
              ? "Customer booking requests for your approved services will appear here."
              : "There are no customer requests in this stage right now."}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {activeTab !== "all" ? (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Show all requests</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchTechnicianRequests}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>Refresh requests</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((booking) => {
            const id = booking._id || booking.id;
            const status = normalizeStatus(booking?.status);
            const paymentStatus = (booking?.paymentStatus || "unpaid")
              .toString()
              .toLowerCase()
              .trim();
            const amount = Number(
              booking?.finalAmount ??
                booking?.totalPrice ??
                booking?.startingPrice ??
                booking?.price ??
                0
            );
            const amountLabel =
              status === "completed" ? "Final amount" : "Starting price";

            const isAccepting = actionKey === `${id}:accepted`;
            const isRejecting = actionKey === `${id}:rejected`;
            const isStarting = actionKey === `${id}:in-progress`;
            const isCompleting = actionKey === `${id}:completed`;
            const isAnyBusy =
              isAccepting || isRejecting || isStarting || isCompleting;

            return (
              <div
                key={id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 rounded-3xl p-4 sm:p-5 shadow-xl transition flex flex-col xl:flex-row xl:items-stretch justify-between gap-5"
              >
                {/* Left Section: Fixed-Size Service Image + Details with Equal Vertical Spacing */}
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

                  <div className="flex-1 min-w-0 space-y-3 py-0.5">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {booking?.serviceTitle || "Repair Service"}
                    </h2>

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

                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-xs sm:text-sm text-slate-400">
                      <span className="min-w-0">
                        Customer:{" "}
                        <strong className="font-semibold text-slate-100">
                          {booking?.customerName || "Customer"}
                        </strong>
                      </span>
                      <span className="shrink-0">
                        Phone:{" "}
                        <strong className="font-semibold text-sky-400">
                          {booking?.phone || "—"}
                        </strong>
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-400 break-words">
                      <span>Address: </span>
                      <strong className="font-semibold text-slate-100">
                        {booking?.address || "—"}
                      </strong>
                    </div>

                    {booking?.problemDescription && (
                      <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                        {booking.problemDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Section: Clean Aligned Ticket, Price, Badges & Step Action */}
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

                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-800/90 text-slate-300 border-slate-700">
                        {paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      {status === "requested" && (
                        <>
                          <button
                            type="button"
                            disabled={isAnyBusy}
                            onClick={() =>
                              handleStatusChange(booking, "accepted")
                            }
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            {isAccepting ? (
                              <FixMateSpinner compact />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept</span>
                          </button>

                          <button
                            type="button"
                            disabled={isAnyBusy}
                            onClick={() =>
                              handleStatusChange(booking, "rejected")
                            }
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            {isRejecting ? (
                              <FixMateSpinner compact />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {status === "accepted" && (
                        <button
                          type="button"
                          disabled={isAnyBusy}
                          onClick={() =>
                            handleStatusChange(booking, "in-progress")
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {isStarting ? (
                            <FixMateSpinner compact />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                          <span>Start job</span>
                        </button>
                      )}

                      {status === "in-progress" && (
                        <button
                          type="button"
                          disabled={isAnyBusy}
                          onClick={() =>
                            handleStatusChange(booking, "completed")
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {isCompleting ? (
                            <FixMateSpinner compact />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Mark completed</span>
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