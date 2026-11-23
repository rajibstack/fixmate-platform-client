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
  Clock,
  Ban,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPageSkeleton,
  FixMateSpinner,
} from "@/components/ui/LoadingState";
import ConfirmModal from "@/components/ui/ConfirmModal";

const TIMELINE_STEPS = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "paid", label: "Paid" },
];

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

function formatTimelineTimestamp(dateValue) {
  if (!dateValue) return "";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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

function getAuthToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function buildUserLookup(users = [], currentUser = null) {
  const byId = new Map();
  const byEmail = new Map();

  const allUsers = Array.isArray(users) ? [...users] : [];
  if (currentUser && typeof currentUser === "object") {
    allUsers.push(currentUser);
  }

  for (const u of allUsers) {
    if (!u || (!u.name && !u.phone && !u.area)) continue;
    const id = String(u._id || u.id || "").trim();
    const email = String(u.email || "").trim().toLowerCase();
    if (id) byId.set(id, u);
    if (email) byEmail.set(email, u);
  }

  return { byId, byEmail };
}

function resolveCustomerDetails(booking, lookup) {
  const id = String(
    booking?.customerId || booking?.userId || booking?.customer?._id || ""
  ).trim();
  const email = String(
    booking?.customerEmail || booking?.userEmail || booking?.customer?.email || ""
  )
    .trim()
    .toLowerCase();

  const matched =
    (id && lookup?.byId?.get(id)) || (email && lookup?.byEmail?.get(email));

  return {
    name:
      matched?.name ||
      booking?.customer?.name ||
      booking?.customerName ||
      "Customer",
    phone: matched?.phone || booking?.phone || booking?.customerPhone || "—",
    address: booking?.address || matched?.area || "—",
  };
}

function normalizeStatus(status) {
  const clean = (status || "requested")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/_/g, "-");
  return clean === "in progress" ? "in-progress" : clean;
}

function normalizePaymentStatus(paymentStatus) {
  return (paymentStatus || "unpaid").toString().toLowerCase().trim();
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case "accepted":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
    case "in-progress":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "rejected":
    case "cancelled":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
    case "requested":
    default:
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
  }
}

function formatStatusText(status) {
  if (status === "in-progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function buildTimelineState(booking) {
  const status = normalizeStatus(booking?.status);
  const paymentStatus = normalizePaymentStatus(booking?.paymentStatus);
  const rawHistory = Array.isArray(booking?.statusHistory)
    ? booking.statusHistory
    : [];

  const historyMap = new Map();
  for (const item of rawHistory) {
    if (!item) continue;
    const stepKey = normalizeStatus(
      typeof item === "string" ? item : item.status
    );
    if (!stepKey) continue;
    historyMap.set(stepKey, item?.changedAt || item?.timestamp || null);
  }

  if (!historyMap.has("requested")) {
    historyMap.set("requested", booking?.createdAt || null);
  }

  if (paymentStatus === "paid" && !historyMap.has("paid")) {
    historyMap.set("paid", booking?.paidAt || booking?.updatedAt || null);
  }

  const isClosed = status === "cancelled" || status === "rejected";
  let highestReachedIndex = -1;

  if (paymentStatus === "paid") {
    highestReachedIndex = 4;
  } else if (status === "completed") {
    highestReachedIndex = 3;
  } else if (status === "in-progress") {
    highestReachedIndex = 2;
  } else if (status === "accepted") {
    highestReachedIndex = 1;
  } else if (status === "requested") {
    highestReachedIndex = 0;
  }

  for (let i = 0; i < TIMELINE_STEPS.length; i++) {
    if (historyMap.has(TIMELINE_STEPS[i].key) && i > highestReachedIndex) {
      highestReachedIndex = i;
    }
  }

  const activeStepIndex = isClosed
    ? -1
    : paymentStatus === "paid"
    ? 4
    : highestReachedIndex;

  return {
    isClosed,
    closedStatus: status,
    closedAt: historyMap.get(status) || booking?.updatedAt || null,
    activeStepIndex,
    steps: TIMELINE_STEPS.map((step, idx) => {
      const hasHistoryEntry = historyMap.has(step.key);
      const isCompleted =
        !isClosed &&
        (idx < activeStepIndex || (idx === 4 && paymentStatus === "paid"));
      const isCurrent =
        !isClosed &&
        idx === activeStepIndex &&
        !(idx === 4 && paymentStatus === "paid");
      const isReached = isCompleted || isCurrent || hasHistoryEntry;

      return {
        ...step,
        isCompleted,
        isCurrent,
        isReached,
        changedAt: historyMap.get(step.key) || null,
      };
    }),
  };
}

function RequestJobTimeline({ booking }) {
  const timeline = useMemo(() => buildTimelineState(booking), [booking]);

  return (
    <div className="mt-3 pt-3 border-t border-sky-500/15 dark:border-slate-800/80 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Job Timeline
        </span>

        {timeline.isClosed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-300">
            <Ban className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>
              {formatStatusText(timeline.closedStatus)}
              {timeline.closedAt
                ? ` • ${formatTimelineTimestamp(timeline.closedAt)}`
                : ""}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Step {Math.min(timeline.activeStepIndex + 1, 5)} of{" "}
            {TIMELINE_STEPS.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {timeline.steps.map((step, index) => {
          const timestampLabel = formatTimelineTimestamp(step.changedAt);

          let cardStyle =
            "bg-white/75 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-500";
          if (step.isCompleted) {
            cardStyle =
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-200";
          } else if (step.isCurrent) {
            cardStyle =
              "bg-sky-500/15 border-sky-400/50 text-sky-700 dark:text-sky-200";
          }

          return (
            <div
              key={step.key}
              className={`rounded-xl border px-2.5 py-2 transition ${cardStyle}`}
            >
              <div className="flex items-center gap-1.5">
                {step.isCompleted ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : step.isCurrent ? (
                  <span className="w-4 h-4 rounded-full bg-sky-400/20 border border-sky-400 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                )}

                <span className="text-xs font-semibold truncate">
                  {step.label}
                </span>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-5.5 truncate">
                {timestampLabel || (step.isReached ? "Recorded" : "Pending")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RequestThumbnail({ src, alt }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (!src || imgFailed) {
    return <Wrench className="w-8 h-8 text-sky-600 dark:text-sky-400" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImgFailed(true)}
      className="w-full h-full object-cover object-center"
    />
  );
}

export default function TechnicianManageRequestsPage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [requestToReject, setRequestToReject] = useState(null);

  const fetchTechnicianRequests = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setFeedback(null);
      }

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error(
            "Please sign in as a technician to view repair requests."
          );
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [res, usersRes] = await Promise.all([
          fetch(`${apiUrl}/api/technician/bookings`, {
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
          throw new Error(data?.message || "Failed to load repair requests.");
        }

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setRequests(list);

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
          setFeedback({
            type: "error",
            message: err.message || "Could not fetch requests.",
          });
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
    fetchTechnicianRequests();

    const handleLiveSync = () => {
      setCurrentUser(readStoredUser());
      fetchTechnicianRequests({ silent: true });
    };

    window.addEventListener("auth-change", handleLiveSync);
    window.addEventListener("storage", handleLiveSync);
    window.addEventListener("bookings-updated", handleLiveSync);
    return () => {
      window.removeEventListener("auth-change", handleLiveSync);
      window.removeEventListener("storage", handleLiveSync);
      window.removeEventListener("bookings-updated", handleLiveSync);
    };
  }, [fetchTechnicianRequests]);

  const userLookup = useMemo(
    () => buildUserLookup(users, currentUser),
    [users, currentUser]
  );

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
      const token = getAuthToken();
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

      const updatedDoc = data?.data || {};
      const nowIso = new Date().toISOString();

      setRequests((prev) =>
        prev.map((item) => {
          if ((item._id || item.id) !== id) return item;
          const prevHistory = Array.isArray(item.statusHistory)
            ? item.statusHistory
            : [];
          return {
            ...item,
            ...updatedDoc,
            status: nextStatus,
            updatedAt: updatedDoc.updatedAt || nowIso,
            statusHistory:
              Array.isArray(updatedDoc.statusHistory) &&
              updatedDoc.statusHistory.length > 0
                ? updatedDoc.statusHistory
                : [
                    ...prevHistory,
                    { status: nextStatus, changedAt: nowIso },
                  ],
          };
        })
      );

      window.dispatchEvent(new Event("bookings-updated"));

      const isRejected = nextStatus === "rejected";
      const toastMsg = isRejected
        ? "Request rejected."
        : `"${booking.serviceTitle}" moved to ${formatStatusText(nextStatus)}.`;
      const bannerMsg = `"${booking.serviceTitle}" moved to ${formatStatusText(
        nextStatus
      )}.`;

      setFeedback({
        type: "success",
        message: bannerMsg,
      });
      toast.success(toastMsg);
      if (isRejected) {
        setRequestToReject(null);
      }
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

  const handleConfirmReject = async () => {
    if (!requestToReject) return;
    await handleStatusChange(requestToReject, "rejected");
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

  const rejectTargetId = requestToReject?._id || requestToReject?.id;
  const isRejectingTarget = Boolean(
    rejectTargetId && actionKey === `${rejectTargetId}:rejected`
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manage requests
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            Move each job forward one step at a time.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Repair request status filter"
          className="inline-flex flex-wrap items-center justify-center sm:justify-start bg-gradient-to-tl from-sky-500/10 via-sky-500/[0.03] to-white dark:from-sky-500/15 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-2 py-1.5 mx-auto lg:mx-0 self-center lg:self-auto shadow-xs"
        >
          {tabs.map((tab, index) => {
            const active = activeTab === tab.key;
            return (
              <div key={tab.key} className="inline-flex items-center">
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-sky-500 text-slate-950 font-semibold shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-sky-500/10 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs ${
                      active
                        ? "text-slate-950/85 font-bold"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>

                {index < tabs.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3.5 border flex items-start gap-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          )}
          <p className="font-medium flex-1">{feedback.message}</p>
        </div>
      )}

      {/* Requests List / States */}
      {filteredRequests.length === 0 ? (
        <div className="py-16 px-6 text-center bg-gradient-to-tl from-sky-500/15 via-sky-500/[0.04] to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/25 dark:border-slate-800 rounded-3xl space-y-3 shadow-md dark:shadow-none">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === "all"
              ? "No repair requests yet"
              : "No repair requests found"}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
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
                onClick={() => fetchTechnicianRequests()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400" />
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
            const paymentStatus = normalizePaymentStatus(booking?.paymentStatus);
            const customer = resolveCustomerDetails(booking, userLookup);
            const amount = Number(
              booking?.finalAmount ||
                booking?.totalPrice ||
                booking?.startingPrice ||
                booking?.price ||
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
                className="bg-gradient-to-tl from-sky-500/15 via-sky-500/[0.04] to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/25 hover:border-sky-500/45 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-md dark:shadow-xl transition flex flex-col xl:flex-row xl:items-stretch justify-between gap-5"
              >
                {/* Left Section: Fixed-Size Service Image + Details + Job Timeline */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 flex-1 min-w-0">
                  <div className="w-full h-36 sm:w-36 sm:h-28 rounded-2xl bg-white/85 dark:bg-slate-950 border border-sky-500/20 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <RequestThumbnail
                      src={booking?.serviceImage}
                      alt={booking?.serviceTitle || "Repair Service"}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2.5 py-0.5">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                      {booking?.serviceTitle || "Repair Service"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Requested{" "}
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatShortDate(booking?.createdAt)}
                        </strong>
                      </span>
                      <span>
                        Preferred{" "}
                        <strong className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatShortDate(booking?.preferredDate)}
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      <span className="min-w-0">
                        Customer:{" "}
                        <strong className="font-semibold text-slate-900 dark:text-slate-100">
                          {customer.name}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>Phone:</span>
                        <strong className="font-semibold text-sky-600 dark:text-sky-400">
                          {customer.phone}
                        </strong>
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 break-words flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                      <span>
                        Address:{" "}
                        <strong className="font-semibold text-slate-900 dark:text-slate-100">
                          {customer.address}
                        </strong>
                      </span>
                    </div>

                    {booking?.problemDescription && (
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300/90 leading-relaxed">
                        {booking.problemDescription}
                      </p>
                    )}

                    <RequestJobTimeline booking={booking} />
                  </div>
                </div>

                {/* Right Section: Clean Aligned Ticket, Price, Badges & Step Action */}
                <div className="w-full xl:w-[27rem] xl:pl-6 xl:border-l xl:border-dashed xl:border-sky-500/20 dark:xl:border-slate-800 flex flex-col justify-between gap-4 shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-0.5">
                      Ticket {getTicketCode(booking)}
                    </span>

                    <div className="text-right">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                        {amountLabel}
                      </span>
                      <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 leading-tight">
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
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          paymentStatus === "paid"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-slate-200/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                        }`}
                      >
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
                            onClick={() => setRequestToReject(booking)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
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

      {/* Reject Request Confirmation Modal */}
      <ConfirmModal
        open={Boolean(requestToReject)}
        variant="warning"
        title="Reject Repair Request?"
        description={`Are you sure you want to reject the request from "${
          requestToReject
            ? resolveCustomerDetails(requestToReject, userLookup).name
            : "Customer"
        }" for "${requestToReject?.serviceTitle || "this service"}"?`}
        confirmText="Reject Request"
        cancelText="Keep Request"
        loading={isRejectingTarget}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          if (!isRejectingTarget) setRequestToReject(null);
        }}
      />
    </div>
  );
}
