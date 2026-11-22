"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "FM"
  );
}

function formatJoinedDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRoleLabel(role = "") {
  const normalized = role.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function readStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
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

export default function ManageUsersPage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [brokenAvatars, setBrokenAvatars] = useState({});

  const fetchUsers = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setFeedback(null);
      }

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Please sign in as an admin to manage users.");
        }

        const res = await fetch(`${apiUrl}/api/admin/users`, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load users.");
        }

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setUsers(list);
      } catch (err) {
        if (!silent) {
          setFeedback({
            type: "error",
            message: err.message || "Could not fetch users list.",
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
    fetchUsers();

    const handleLiveSync = () => {
      setCurrentUser(readStoredUser());
      fetchUsers({ silent: true });
    };

    window.addEventListener("auth-change", handleLiveSync);
    window.addEventListener("storage", handleLiveSync);
    return () => {
      window.removeEventListener("auth-change", handleLiveSync);
      window.removeEventListener("storage", handleLiveSync);
    };
  }, [fetchUsers]);

  const counts = useMemo(() => {
    let customers = 0;
    let technicians = 0;
    let admins = 0;

    for (const u of users) {
      const r = (u.role || "customer").toLowerCase();
      if (r === "technician") technicians += 1;
      else if (r === "admin") admins += 1;
      else customers += 1;
    }

    return {
      all: users.length,
      customers,
      technicians,
      admins,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (activeTab === "all") return users;
    return users.filter(
      (u) => (u.role || "customer").toLowerCase() === activeTab
    );
  }, [users, activeTab]);

  const isSelfUser = useCallback(
    (u) => {
      if (!currentUser) return false;
      const currentId = currentUser._id || currentUser.id;
      const targetId = u._id || u.id;
      if (currentId && targetId && String(currentId) === String(targetId)) {
        return true;
      }
      if (
        currentUser.email &&
        u.email &&
        currentUser.email.toLowerCase() === u.email.toLowerCase()
      ) {
        return true;
      }
      return false;
    },
    [currentUser]
  );

  const handleRoleChange = async (targetUser, nextRole) => {
    const id = targetUser._id || targetUser.id;
    const prevRole = targetUser.role;

    if (isSelfUser(targetUser)) {
      const msg = "Your own role cannot be changed here.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    if (prevRole === nextRole) return;

    setUpdatingId(id);
    setFeedback(null);

    setUsers((prev) =>
      prev.map((item) =>
        (item._id || item.id) === id ? { ...item, role: nextRole } : item
      )
    );

    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: nextRole }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update user role.");
      }

      const msg = `${targetUser.name || "User"}'s role updated to ${formatRoleLabel(
        nextRole
      )}.`;
      setFeedback({
        type: "success",
        message: msg,
      });
      toast.success(msg);
    } catch (err) {
      setUsers((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id ? { ...item, role: prevRole } : item
        )
      );
      const errMsg = err.message || "Could not update user role.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const filterTabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "customer", label: "Customers", count: counts.customers },
    { key: "technician", label: "Technicians", count: counts.technicians },
    { key: "admin", label: "Admins", count: counts.admins },
  ];

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Segmented Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manage users
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            Change a user&apos;s role. Your own role cannot be changed here.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1 self-start lg:self-auto shadow-xs dark:shadow-none">
          {filterTabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
                  active
                    ? "bg-sky-500 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs ${
                    active
                      ? "text-slate-950/80 font-bold"
                      : "text-slate-500 dark:text-slate-400"
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

      {/* Users Table Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md dark:shadow-xl overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeTab === "all" ? "No users yet" : "No users found"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {activeTab === "all"
                ? "Registered accounts will appear here once users sign up."
                : "There are no users matching the selected role filter right now."}
            </p>
            {activeTab !== "all" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Show all users</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/90 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40">
                  <th className="py-4 px-5">User</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Area</th>
                  <th className="py-4 px-4">Joined</th>
                  <th className="py-4 px-5 text-right sm:text-left">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm">
                {filteredUsers.map((u) => {
                  const id = u._id || u.id;
                  const selfRow = isSelfUser(u);
                  const displayName =
                    (selfRow && currentUser?.name) || u.name || "Unnamed User";
                  const displayAvatar =
                    (selfRow && currentUser?.avatar) || u.avatar || "";
                  const displayArea =
                    (selfRow && currentUser?.area) || u.area || "";
                  const currentRole = (u.role || "customer").toLowerCase();
                  const showAvatarImg =
                    Boolean(displayAvatar) && !brokenAvatars[id];

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User Avatar + Name + (you) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          {showAvatarImg ? (
                            <img
                              src={displayAvatar}
                              alt={displayName}
                              onError={() =>
                                setBrokenAvatars((prev) => ({
                                  ...prev,
                                  [id]: true,
                                }))
                              }
                              className="w-10 h-10 rounded-full object-cover border border-sky-500/30 shrink-0"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xs shrink-0">
                              {getInitials(displayName)}
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {displayName}
                            </span>
                            {selfRow && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                                (you)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Area */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {displayArea ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{displayArea}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">
                            —
                          </span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatJoinedDate(u.createdAt)}
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <select
                          aria-label={`Change role for ${displayName}`}
                          disabled={selfRow || updatingId === id}
                          value={currentRole}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className={`rounded-xl border px-3.5 py-2 text-sm font-medium outline-none transition ${
                            selfRow
                              ? "bg-slate-100/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 hover:border-sky-500/60 focus:border-sky-500 text-slate-900 dark:text-white cursor-pointer"
                          }`}
                        >
                          <option
                            value="customer"
                            className="bg-white dark:bg-slate-900"
                          >
                            Customer
                          </option>
                          <option
                            value="technician"
                            className="bg-white dark:bg-slate-900"
                          >
                            Technician
                          </option>
                          <option
                            value="admin"
                            className="bg-white dark:bg-slate-900"
                          >
                            Admin
                          </option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}