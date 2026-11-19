"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
} from "lucide-react";

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

export default function ManageUsersPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load users.");
      }

      setUsers(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not fetch users list.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchUsers();
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

  const isSelfUser = (u) => {
    if (!currentUser) return false;
    if (currentUser._id && u._id && String(currentUser._id) === String(u._id)) {
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
  };

  const handleRoleChange = async (targetUser, nextRole) => {
    const id = targetUser._id || targetUser.id;
    const prevRole = targetUser.role;

    if (isSelfUser(targetUser)) {
      setFeedback({
        type: "error",
        message: "Your own role cannot be changed here.",
      });
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
      const token = localStorage.getItem("token");
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

      setFeedback({
        type: "success",
        message: `${targetUser.name}'s role updated to ${formatRoleLabel(nextRole)}.`,
      });
    } catch (err) {
      setUsers((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id ? { ...item, role: prevRole } : item
        )
      );
      setFeedback({
        type: "error",
        message: err.message || "Could not update user role.",
      });
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Segmented Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Manage users
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Change a user&apos;s role. Your own role cannot be changed here.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center bg-slate-900/95 border border-slate-800 rounded-xl p-1 gap-1 self-start lg:self-auto">
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

      {/* Users Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-sm">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">No users found</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              There are no users matching the selected role filter right now.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/90 text-xs font-semibold text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-5">User</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Area</th>
                  <th className="py-4 px-4">Joined</th>
                  <th className="py-4 px-5 text-right sm:text-left">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredUsers.map((u) => {
                  const id = u._id || u.id;
                  const selfRow = isSelfUser(u);
                  const currentRole = (u.role || "customer").toLowerCase();

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User Avatar + Name + (you) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3.5">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.name || "User"}
                              className="w-10 h-10 rounded-full object-cover border border-sky-500/30 shrink-0"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-xs shrink-0">
                              {getInitials(u.name)}
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {u.name || "Unnamed User"}
                            </span>
                            {selfRow && (
                              <span className="text-xs text-slate-400 font-normal">
                                (you)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Area */}
                      <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                        {u.area ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{u.area}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                        {formatJoinedDate(u.createdAt)}
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <select
                          aria-label={`Change role for ${u.name}`}
                          disabled={selfRow || updatingId === id}
                          value={currentRole}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className={`rounded-xl border px-3.5 py-2 text-sm font-medium outline-none transition ${
                            selfRow
                              ? "bg-slate-950/50 border-slate-800/80 text-slate-500 cursor-not-allowed"
                              : "bg-slate-950 border-slate-700 hover:border-sky-500/60 focus:border-sky-500 text-white cursor-pointer"
                          }`}
                        >
                          <option value="customer" className="bg-slate-900">
                            Customer
                          </option>
                          <option value="technician" className="bg-slate-900">
                            Technician
                          </option>
                          <option value="admin" className="bg-slate-900">
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