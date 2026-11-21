"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  ArrowRight,
  Star,
  X,
  Check,
  Clock,
  Ban,
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

function resolveTechnicianName(booking, lookup) {
  const bTechId = String(
    booking?.technicianId ||
      booking?.technician?._id ||
      booking?.technician?.id ||
      ""
  ).trim();
  const bTechEmail = String(
    booking?.technicianEmail || booking?.technician?.email || ""
  )
    .trim()
    .toLowerCase();

  const matched =
    (bTechId && lookup?.byId?.get(bTechId)) ||
    (bTechEmail && lookup?.byEmail?.get(bTechEmail));

  return (
    matched?.name ||
    booking?.technician?.name ||
    booking?.technicianName ||
    "Technician"
  );
}

function normalizeStatus(status) {
  const clean = (status || "requested").toString().toLowerCase().trim();
  return clean === "in progress" ? "in-progress" : clean;
}

function normalizePaymentStatus(paymentStatus) {
  return (paymentStatus || "unpaid").toString().toLowerCase().trim();
}

function getBookingRating(booking) {
  const raw =
    booking?.rating ?? booking?.reviewRating ?? booking?.stars ?? null;
  const num = Number(raw);
  return Number.isFinite(num) && num >= 1 && num <= 5 ? Math.round(num) : 0;
}

function getBookingReviewText(booking) {
  return String(
    booking?.review ?? booking?.reviewText ?? booking?.comment ?? ""
  ).trim();
}

function getStatusBadgeStyle(status) {
  switch (status) {
    case "accepted":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "in-progress":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "cancelled":
    case "rejected":
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

function getPaymentBadgeStyle(paymentStatus) {
  if (paymentStatus === "paid") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
  return "bg-slate-800/90 text-slate-300 border-slate-700";
}

function formatPaymentText(paymentStatus) {
  return paymentStatus === "paid" ? "Paid" : "Unpaid";
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
    historyMap.set(stepKey, item?.changedAt || null);
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
        !isClosed && (idx < activeStepIndex || (idx === 4 && paymentStatus === "paid"));
      const isCurrent =
        !isClosed && idx === activeStepIndex && !(idx === 4 && paymentStatus === "paid");
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

function JobTimelineTracker({ booking }) {
  const timeline = useMemo(() => buildTimelineState(booking), [booking]);

  return (
    <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Job Timeline
        </span>

        {timeline.isClosed ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300">
            <Ban className="w-3 h-3 text-rose-400" />
            <span>
              {formatStatusText(timeline.closedStatus)}
              {timeline.closedAt
                ? ` • ${formatTimelineTimestamp(timeline.closedAt)}`
                : ""}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">
            Step {Math.min(timeline.activeStepIndex + 1, 5)} of{" "}
            {TIMELINE_STEPS.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {timeline.steps.map((step, index) => {
          const timestampLabel = formatTimelineTimestamp(step.changedAt);

          let cardStyle =
            "bg-slate-950/60 border-slate-800/80 text-slate-500";
          if (step.isCompleted) {
            cardStyle =
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-200";
          } else if (step.isCurrent) {
            cardStyle = "bg-sky-500/15 border-sky-400/50 text-sky-200";
          }

          return (
            <div
              key={step.key}
              className={`rounded-xl border px-2.5 py-2 transition ${cardStyle}`}
            >
              <div className="flex items-center gap-1.5">
                {step.isCompleted ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : step.isCurrent ? (
                  <span className="w-4 h-4 rounded-full bg-sky-400/20 border border-sky-400 text-sky-300 flex items-center justify-center shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                )}

                <span className="text-xs font-semibold truncate">
                  {step.label}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 mt-1 pl-5.5 truncate">
                {timestampLabel || (step.isReached ? "Recorded" : "Pending")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingThumbnail({ src, alt }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (!src || imgFailed) {
    return <Wrench className="w-8 h-8 text-sky-400" />;
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

export default function CustomerMyBookingsPage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const [reviewBooking, setReviewBooking] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchMyBookings = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setFeedback(null);
      }

      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken") ||
          "";
        if (!token) {
          throw new Error("Please sign in to view your bookings.");
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
          throw new Error(data?.message || "Failed to load your bookings.");
        }

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setBookings(list);

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
            message: err.message || "Could not fetch bookings.",
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
    fetchMyBookings();

    const handleSessionOrProfileChange = () => {
      setCurrentUser(readStoredUser());
      fetchMyBookings({ silent: true });
    };

    window.addEventListener("auth-change", handleSessionOrProfileChange);
    window.addEventListener("storage", handleSessionOrProfileChange);

    return () => {
      window.removeEventListener("auth-change", handleSessionOrProfileChange);
      window.removeEventListener("storage", handleSessionOrProfileChange);
    };
  }, [fetchMyBookings]);

  const userLookup = useMemo(
    () => buildUserLookup(users, currentUser),
    [users, currentUser]
  );

  const counts = useMemo(() => {
    let active = 0;
    let toPay = 0;
    let paid = 0;
    let closed = 0;

    for (const b of bookings) {
      const st = normalizeStatus(b?.status);
      const pay = normalizePaymentStatus(b?.paymentStatus);

      if (["requested", "accepted", "in-progress"].includes(st)) {
        active += 1;
      }
      if (st === "completed" && pay !== "paid") {
        toPay += 1;
      }
      if (pay === "paid") {
        paid += 1;
      }
      if (["cancelled", "rejected"].includes(st)) {
        closed += 1;
      }
    }

    return {
      all: bookings.length,
      active,
      toPay,
      paid,
      closed,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const st = normalizeStatus(b?.status);
      const pay = normalizePaymentStatus(b?.paymentStatus);

      if (activeTab === "active") {
        return ["requested", "accepted", "in-progress"].includes(st);
      }
      if (activeTab === "to-pay") {
        return st === "completed" && pay !== "paid";
      }
      if (activeTab === "paid") {
        return pay === "paid";
      }
      if (activeTab === "closed") {
        return ["cancelled", "rejected"].includes(st);
      }
      return true;
    });
  }, [bookings, activeTab]);

  const handleConfirmCancelRequest = async () => {
    if (!bookingToCancel) return;
    const id = bookingToCancel._id || bookingToCancel.id;
    setActionId(id);
    setFeedback(null);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";
      const res = await fetch(`${apiUrl}/api/bookings/${id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to cancel booking request.");
      }

      const updatedDoc = data?.data || {};
      const nowIso = new Date().toISOString();

      setBookings((prev) =>
        prev.map((item) => {
          if ((item._id || item.id) !== id) return item;
          const prevHistory = Array.isArray(item.statusHistory)
            ? item.statusHistory
            : [];
          return {
            ...item,
            ...updatedDoc,
            status: "cancelled",
            statusHistory:
              Array.isArray(updatedDoc.statusHistory) &&
              updatedDoc.statusHistory.length > 0
                ? updatedDoc.statusHistory
                : [
                    ...prevHistory,
                    { status: "cancelled", changedAt: nowIso },
                  ],
          };
        })
      );

      const successMsg = "Booking cancelled.";
      setFeedback({
        type: "success",
        message: `Request for "${
          bookingToCancel.serviceTitle || "service"
        }" has been cancelled.`,
      });
      toast.success(successMsg);
      setBookingToCancel(null);
    } catch (err) {
      const errMsg = err.message || "Could not cancel booking request.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setActionId(null);
    }
  };

  const handlePayNow = async (booking) => {
    const id = booking._id || booking.id;
    const status = normalizeStatus(booking?.status);
    const paymentStatus = normalizePaymentStatus(booking?.paymentStatus);

    if (status !== "completed" || paymentStatus === "paid") {
      const gateMsg =
        "Payment is available only once the repair is completed and unpaid.";
      setFeedback({ type: "error", message: gateMsg });
      toast.error(gateMsg);
      return;
    }

    setActionId(id);
    setFeedback(null);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";
      const amount = Number(
        booking.paidAmount ||
          booking.finalAmount ||
          booking.totalPrice ||
          booking.startingPrice ||
          0
      );

      const res = await fetch(`${apiUrl}/api/bookings/${id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bookingId: id,
          amount,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Payment could not be completed.");
      }

      const updatedBooking = data?.data || {};
      const paidAtIso = updatedBooking.paidAt || new Date().toISOString();

      setBookings((prev) =>
        prev.map((item) => {
          if ((item._id || item.id) !== id) return item;
          const prevHistory = Array.isArray(item.statusHistory)
            ? item.statusHistory
            : [];
          return {
            ...item,
            ...updatedBooking,
            paymentStatus: "paid",
            paidAmount: updatedBooking.paidAmount ?? amount,
            transactionId:
              updatedBooking.transactionId || item.transactionId || "",
            paidAt: paidAtIso,
            statusHistory:
              Array.isArray(updatedBooking.statusHistory) &&
              updatedBooking.statusHistory.length > 0
                ? updatedBooking.statusHistory
                : [...prevHistory, { status: "paid", changedAt: paidAtIso }],
          };
        })
      );

      const msg = `Payment completed for "${booking.serviceTitle}".`;
      setFeedback({
        type: "success",
        message: msg,
      });
      toast.success(msg);
    } catch (err) {
      const errMsg = err.message || "Could not process payment.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setActionId(null);
    }
  };

  const openReviewModal = (booking) => {
    const existingRating = getBookingRating(booking);
    const existingReview = getBookingReviewText(booking);
    setReviewBooking(booking);
    setRatingValue(existingRating || 5);
    setHoverRating(0);
    setReviewText(existingReview);
    setReviewError("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;

    const id = reviewBooking._id || reviewBooking.id;
    const paymentStatus = normalizePaymentStatus(reviewBooking?.paymentStatus);
    const trimmedReview = reviewText.trim();

    if (paymentStatus !== "paid") {
      setReviewError(
        "You can leave a rating and review after payment is completed."
      );
      return;
    }

    if (ratingValue < 1 || ratingValue > 5) {
      setReviewError("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!trimmedReview) {
      setReviewError("Please write a short review.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");
    setFeedback(null);

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";

      const reviewPayload = {
        rating: Number(ratingValue),
        review: trimmedReview,
      };

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let res = await fetch(`${apiUrl}/api/bookings/${id}/review`, {
        method: "POST",
        headers,
        body: JSON.stringify(reviewPayload),
      });

      if (res.status === 404) {
        res = await fetch(`${apiUrl}/api/bookings/${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(reviewPayload),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to save rating and review.");
      }

      const updatedDoc = data?.data || {};
      const finalRating = Number(updatedDoc.rating ?? ratingValue);
      const finalReview = String(
        updatedDoc.review ?? updatedDoc.reviewText ?? trimmedReview
      ).trim();

      setBookings((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? {
                ...item,
                ...updatedDoc,
                rating: finalRating,
                review: finalReview,
                reviewedAt: updatedDoc.reviewedAt || new Date().toISOString(),
              }
            : item
        )
      );

      setReviewBooking(null);
      const successMsg = `Rating & review saved for "${reviewBooking.serviceTitle}".`;
      setFeedback({ type: "success", message: successMsg });
      toast.success("Thank you for your rating and review!");
    } catch (err) {
      const errMsg = err.message || "Could not submit review.";
      setReviewError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "to-pay", label: "To pay", count: counts.toPay },
    { key: "paid", label: "Paid", count: counts.paid },
    { key: "closed", label: "Closed", count: counts.closed },
  ];

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  const cancelTargetId = bookingToCancel?._id || bookingToCancel?.id;
  const isCancellingTarget = Boolean(
    cancelTargetId && actionId === cancelTargetId
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My bookings
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Track each repair from request to payment.
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

      {/* Bookings List / States */}
      {filteredBookings.length === 0 ? (
        <div className="py-16 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            No bookings found
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            There are no repair bookings under this filter right now.
          </p>
          <div className="pt-2">
            <Link
              href="/services"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20"
            >
              <span>Browse Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const id = booking._id || booking.id;
            const status = normalizeStatus(booking?.status);
            const paymentStatus = normalizePaymentStatus(booking?.paymentStatus);
            const busy = actionId === id;
            const techName = resolveTechnicianName(booking, userLookup);

            const amount = Number(
              booking?.paidAmount ||
                booking?.finalAmount ||
                booking?.totalPrice ||
                booking?.startingPrice ||
                booking?.price ||
                0
            );
            const amountLabel =
              status === "completed" ? "Final amount" : "Starting price";

            const canCancel = status === "requested";
            const canPay = status === "completed" && paymentStatus !== "paid";
            const canReview = paymentStatus === "paid";

            const savedRating = getBookingRating(booking);
            const savedReview = getBookingReviewText(booking);
            const hasReview = savedRating > 0 || Boolean(savedReview);

            return (
              <div
                key={id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 rounded-3xl p-4 sm:p-5 shadow-xl transition flex flex-col xl:flex-row xl:items-stretch justify-between gap-5"
              >
                {/* Left Section: Fixed-Size Thumbnail + Info + Problem Description + Saved Review + Job Timeline */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 flex-1 min-w-0">
                  <div className="w-full h-36 sm:w-36 sm:h-28 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <BookingThumbnail
                      src={booking?.serviceImage}
                      alt={booking?.serviceTitle || "Repair Service"}
                    />
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-white truncate">
                      {booking?.serviceTitle || "Repair Service"}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-400 truncate">
                      {techName}
                      {booking?.technicianEmail
                        ? `, ${booking.technicianEmail}`
                        : ""}
                    </p>

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

                    {booking?.problemDescription && (
                      <p className="text-xs sm:text-sm text-slate-300/90 pt-1 leading-relaxed">
                        {booking.problemDescription}
                      </p>
                    )}

                    {hasReview && (
                      <div className="mt-2 rounded-2xl bg-slate-950/80 border border-amber-400/20 px-3.5 py-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= savedRating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-700"
                              }`}
                            />
                          ))}
                          <span className="text-xs font-semibold text-amber-300 ml-1">
                            {savedRating}/5
                          </span>
                        </div>
                        {savedReview && (
                          <p className="text-xs text-slate-300 leading-relaxed">
                            “{savedReview}”
                          </p>
                        )}
                      </div>
                    )}

                    <JobTimelineTracker booking={booking} />
                  </div>
                </div>

                {/* Right Section: Expanded Leftward, No Top Dash, Side-by-Side Badges & Action */}
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

                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentBadgeStyle(
                          paymentStatus
                        )}`}
                      >
                        {formatPaymentText(paymentStatus)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      {canCancel && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setBookingToCancel(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {busy ? (
                            <FixMateSpinner compact />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Cancel request</span>
                        </button>
                      )}

                      {canPay && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handlePayNow(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          {busy ? (
                            <FixMateSpinner compact />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5" />
                          )}
                          <span>Pay now</span>
                        </button>
                      )}

                      {canReview && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openReviewModal(booking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/35 text-sky-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>
                            {hasReview ? "Edit review" : "Rate & review"}
                          </span>
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

      {/* Rating & Review Modal (After Booking Is Paid) */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Paid Booking Review
                </p>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Rate &amp; Review — {reviewBooking.serviceTitle || "Service"}
                </h2>
              </div>
              <button
                type="button"
                disabled={submittingReview}
                onClick={() => setReviewBooking(null)}
                aria-label="Close review modal"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewError && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Star Rating (1–5) *
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeStar = star <= (hoverRating || ratingValue);
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => {
                          setRatingValue(star);
                          if (reviewError) setReviewError("");
                        }}
                        aria-label={`Rate ${star} out of 5 stars`}
                        className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/40 transition cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 transition ${
                            activeStar
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-600"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-sm font-bold text-amber-300 ml-2">
                    {ratingValue} / 5
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="booking-review-text"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Short Review *
                </label>
                <textarea
                  id="booking-review-text"
                  rows={3}
                  required
                  value={reviewText}
                  onChange={(e) => {
                    setReviewText(e.target.value);
                    if (reviewError) setReviewError("");
                  }}
                  placeholder="Share your experience with the repair and technician..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 p-3 text-sm text-white placeholder:text-slate-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={() => setReviewBooking(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-60"
                >
                  {submittingReview && <FixMateSpinner compact />}
                  <span>
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      <ConfirmModal
        open={Boolean(bookingToCancel)}
        variant="warning"
        title="Cancel Booking?"
        description={`Are you sure you want to cancel your booking for "${
          bookingToCancel?.serviceTitle || "this service"
        }"?`}
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        loading={isCancellingTarget}
        onConfirm={handleConfirmCancelRequest}
        onCancel={() => {
          if (!isCancellingTarget) setBookingToCancel(null);
        }}
      />
    </div>
  );
}