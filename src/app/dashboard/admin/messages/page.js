"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

const statusStyles = {
  unread: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  read: "bg-slate-800 text-slate-300 border-slate-700",
  replied: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

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

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/api/admin/messages`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load contact messages.");
      }

      setMessages(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Could not fetch messages.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
      if (!res.ok || !data?.data) {
        throw new Error(data?.message || "Failed to update message status.");
      }

      setMessages((prev) =>
        prev.map((msg) => (msg._id === id ? data.data : msg))
      );
      toast.success(`Message marked as ${nextStatus}.`);
    } catch (err) {
      toast.error(err.message || "Could not update message status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMessages =
    filter === "all"
      ? messages
      : messages.filter((m) => (m.status || "unread") === filter);

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-400" />
            <span>Contact Messages</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
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
                  : "bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchMessages}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-5 text-sm">
          {error}
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            {filter === "all"
              ? "No contact messages yet"
              : `No ${filter} messages`}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
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
                onClick={fetchMessages}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>Refresh inbox</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredMessages.map((msg) => (
            <div
              key={msg._id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-5 sm:p-6 space-y-4 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                      <User className="w-4 h-4 text-sky-400" />
                      {msg.name}
                    </span>
                    <span className="text-slate-600">•</span>
                    <a
                      href={`mailto:${msg.email}`}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-sky-400 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {msg.email}
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-medium">
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

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${
                      statusStyles[msg.status] || statusStyles.unread
                    }`}
                  >
                    {msg.status || "unread"}
                  </span>

                  <select
                    aria-label="Update message status"
                    disabled={updatingId === msg._id}
                    value={msg.status || "unread"}
                    onChange={(e) => handleStatusChange(msg._id, e.target.value)}
                    className="rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2.5 py-1.5 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                  </select>
                </div>
              </div>

              <p className="text-sm text-slate-300 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 leading-relaxed whitespace-pre-line">
                {msg.message}
              </p>

              {msg.status === "replied" && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marked as replied</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}