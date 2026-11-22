"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  RotateCcw,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

const statusStyles = {
  unread:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  read: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
  replied:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteMsg, setPendingDeleteMsg] = useState(null);

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    try {
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        parsedUser?.token ||
        ""
      );
    } catch {
      return localStorage.getItem("token") || "";
    }
  };

  const fetchMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError("");
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error(
            "Please sign in as an admin to view contact messages."
          );
        }

        const res = await fetch(
          `${apiUrl}/api/admin/messages?_t=${Date.now()}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load contact messages.");
        }

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setMessages(list);
      } catch (err) {
        if (!silent) {
          setError(err.message || "Could not fetch messages.");
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
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const handleSync = () => {
      if (document.visibilityState === "visible") {
        fetchMessages({ silent: true });
      }
    };

    window.addEventListener("focus", handleSync);
    document.addEventListener("visibilitychange", handleSync);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMessages({ silent: true });
      }
    }, 20000);

    return () => {
      window.removeEventListener("focus", handleSync);
      document.removeEventListener("visibilitychange", handleSync);
      window.clearInterval(intervalId);
    };
  }, [fetchMessages]);

  useEffect(() => {
    if (!pendingDeleteMsg) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !deletingId) {
        setPendingDeleteMsg(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDeleteMsg, deletingId]);

  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/api/admin/messages/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update message status.");
      }

      const updatedItem = data?.data || data?.message;
      setMessages((prev) =>
        prev.map((msg) => {
          const currentId = msg._id || msg.id;
          if (currentId !== id) return msg;
          return updatedItem && typeof updatedItem === "object"
            ? {
                ...msg,
                ...updatedItem,
                status: updatedItem.status || nextStatus,
              }
            : { ...msg, status: nextStatus };
        })
      );
      toast.success(`Message marked as ${nextStatus}.`);
    } catch (err) {
      toast.error(err.message || "Could not update message status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    const target = pendingDeleteMsg;
    const id = target?._id || target?.id;
    if (!id) return;

    setDeletingId(id);
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/api/admin/messages/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete message.");
      }

      setMessages((prev) => prev.filter((msg) => (msg._id || msg.id) !== id));
      setPendingDeleteMsg(null);
      toast.success("Message deleted successfully.");
    } catch (err) {
      toast.error(err.message || "Could not delete message.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMessages =
    filter === "all"
      ? messages
      : messages.filter((m) => (m?.status || "unread") === filter);

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs dark:shadow-none">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Contact Messages</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Messages submitted from the public Contact Us page ({messages.length}{" "}
            total)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["all", "unread", "read", "replied"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
                filter === tab
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}

          <button
            type="button"
            onClick={() => fetchMessages({ silent: false })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-2xl p-5 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => fetchMessages({ silent: false })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-semibold transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-md dark:shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {filter === "all"
              ? "No contact messages yet"
              : `No ${filter} messages`}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {filter === "all"
              ? "Submissions from the Contact Us page will show up here for review."
              : `There are currently no messages marked as ${filter}.`}
          </p>
          <div className="pt-2">
            {filter !== "all" ? (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Show all messages</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fetchMessages({ silent: false })}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Refresh inbox</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMessages.map((msg) => {
            const id = msg._id || msg.id;
            const currentStatus = msg.status || "unread";
            const phoneNumber = String(
              msg.phone || msg.contactNumber || ""
            ).trim();

            return (
              <div
                key={id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs dark:shadow-none transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                        <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        {msg.name || "Anonymous User"}
                      </span>
                      <span className="text-slate-400 dark:text-slate-600">
                        •
                      </span>
                      {msg.email ? (
                        <a
                          href={`mailto:${msg.email}`}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {msg.email}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                          No email provided
                        </span>
                      )}
                      {phoneNumber && (
                        <>
                          <span className="text-slate-400 dark:text-slate-600">
                            •
                          </span>
                          <a
                            href={`tel:${phoneNumber}`}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            {phoneNumber}
                          </a>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {msg.topic || "General Inquiry"}
                      </span>
                      {msg.createdAt && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
                        statusStyles[currentStatus] || statusStyles.unread
                      }`}
                    >
                      {currentStatus}
                    </span>

                    <select
                      aria-label="Update message status"
                      disabled={updatingId === id || deletingId === id}
                      value={currentStatus}
                      onChange={(e) =>
                        handleStatusChange(id, e.target.value)
                      }
                      className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 px-2.5 py-1.5 focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      <option
                        value="unread"
                        className="bg-white dark:bg-slate-950"
                      >
                        Unread
                      </option>
                      <option
                        value="read"
                        className="bg-white dark:bg-slate-950"
                      >
                        Read
                      </option>
                      <option
                        value="replied"
                        className="bg-white dark:bg-slate-950"
                      >
                        Replied
                      </option>
                    </select>

                    <button
                      type="button"
                      disabled={deletingId === id || updatingId === id}
                      onClick={() => setPendingDeleteMsg(msg)}
                      aria-label={`Delete message from ${msg.name || "user"}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 transition cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-4 leading-relaxed whitespace-pre-line">
                  {msg.message}
                </p>

                {currentStatus === "replied" && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marked as replied</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDeleteMsg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-message-modal-title"
          onClick={() => {
            if (!deletingId) setPendingDeleteMsg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="delete-message-modal-title"
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                  >
                    Delete this message?
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setPendingDeleteMsg(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {pendingDeleteMsg.name || "Anonymous User"}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                {pendingDeleteMsg.email || "No email"}
                {(pendingDeleteMsg.phone || pendingDeleteMsg.contactNumber) &&
                  ` • ${
                    pendingDeleteMsg.phone || pendingDeleteMsg.contactNumber
                  }`}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 pt-1">
                {pendingDeleteMsg.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setPendingDeleteMsg(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {deletingId ? "Deleting..." : "Delete Message"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}