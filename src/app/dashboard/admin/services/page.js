"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";
import ConfirmModal from "@/components/ui/ConfirmModal";

function formatSubmittedDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadgeStyle(status) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "approved") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
  }
  if (normalized === "rejected") {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25";
  }
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25";
}

function formatStatusLabel(status) {
  const normalized = (status || "pending").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

function resolveTechnicianName(service, lookup) {
  const id = String(
    service?.technicianId ||
      service?.userId ||
      service?.technician?._id ||
      ""
  ).trim();
  const email = String(
    service?.technicianEmail ||
      service?.userEmail ||
      service?.technician?.email ||
      ""
  )
    .trim()
    .toLowerCase();

  const matched =
    (id && lookup?.byId?.get(id)) || (email && lookup?.byEmail?.get(email));

  return (
    matched?.name ||
    service?.technician?.name ||
    service?.technicianName ||
    service?.technicianEmail ||
    "—"
  );
}

function AdminServiceThumbnail({ src, alt }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (!src || imgFailed) {
    return <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImgFailed(true)}
      className="w-full h-full object-cover"
    />
  );
}

export default function ManageServicesPage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [serviceToReject, setServiceToReject] = useState(null);

  const fetchServices = useCallback(
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
          throw new Error("Please sign in as an admin to manage services.");
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [servicesRes, usersRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/services`, {
            cache: "no-store",
            headers,
          }),
          fetch(`${apiUrl}/api/admin/users`, {
            cache: "no-store",
            headers,
          }),
        ]);

        const data = await servicesRes.json().catch(() => ({}));
        if (!servicesRes.ok) {
          throw new Error(data?.message || "Failed to load services.");
        }

        const serviceList = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        setServices(serviceList);

        if (usersRes.ok) {
          const usersData = await usersRes.json().catch(() => ({}));
          const userList = Array.isArray(usersData?.data)
            ? usersData.data
            : Array.isArray(usersData)
            ? usersData
            : [];
          setUsers(userList);
        }
      } catch (err) {
        if (!silent) {
          setFeedback({
            type: "error",
            message: err.message || "Could not fetch services.",
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
    fetchServices();

    const handleLiveSync = () => {
      setCurrentUser(readStoredUser());
      fetchServices({ silent: true });
    };

    window.addEventListener("auth-change", handleLiveSync);
    window.addEventListener("storage", handleLiveSync);
    return () => {
      window.removeEventListener("auth-change", handleLiveSync);
      window.removeEventListener("storage", handleLiveSync);
    };
  }, [fetchServices]);

  const userLookup = useMemo(
    () => buildUserLookup(users, currentUser),
    [users, currentUser]
  );

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const s of services) {
      const st = (s.status || "pending").toLowerCase();
      if (st === "approved") approved += 1;
      else if (st === "rejected") rejected += 1;
      else pending += 1;
    }

    return {
      pending,
      approved,
      rejected,
      all: services.length,
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeTab === "all") return services;
    return services.filter(
      (s) => (s.status || "pending").toLowerCase() === activeTab
    );
  }, [services, activeTab]);

  const handleStatusChange = async (service, nextStatus) => {
    const id = service._id || service.id;
    const prevStatus = service.status || "pending";
    if (prevStatus === nextStatus) return;

    setUpdatingId(id);
    setFeedback(null);

    setServices((prev) =>
      prev.map((item) =>
        (item._id || item.id) === id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        "";
      const res = await fetch(`${apiUrl}/api/admin/services/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update service status.");
      }

      const updatedDoc = data?.data || {};
      setServices((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, ...updatedDoc, status: nextStatus }
            : item
        )
      );

      const msg = `"${service.title}" marked as ${formatStatusLabel(
        nextStatus
      )}.`;
      setFeedback({
        type: "success",
        message: msg,
      });
      toast.success(msg);
      setServiceToReject(null);
    } catch (err) {
      setServices((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id ? { ...item, status: prevStatus } : item
        )
      );
      const errMsg = err.message || "Could not update service status.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!serviceToReject) return;
    await handleStatusChange(serviceToReject, "rejected");
  };

  const filterTabs = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "all", label: "All", count: counts.all },
  ];

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  const rejectTargetId = serviceToReject?._id || serviceToReject?.id;
  const isRejecting = Boolean(rejectTargetId && updatingId === rejectTargetId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header + Filter Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manage services
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            Only approved and available services appear on the public site.
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

      {/* Services Table Card */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md dark:shadow-xl overflow-hidden">
        {filteredServices.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {activeTab === "all"
                ? "No services submitted yet"
                : "No services found"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {activeTab === "all"
                ? "Technician service listings will appear here for review once submitted."
                : "There are no services in this status category right now."}
            </p>
            {activeTab !== "all" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Show all services</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/90 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40">
                  <th className="py-4 px-5">Service</th>
                  <th className="py-4 px-4">Technician</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Submitted</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm">
                {filteredServices.map((service) => {
                  const id = service._id || service.id;
                  const status = (service.status || "pending").toLowerCase();
                  const busy = updatingId === id;
                  const technicianLabel = resolveTechnicianName(
                    service,
                    userLookup
                  );

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Service Image/Icon + Title + Category */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-11 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <AdminServiceThumbnail
                              src={service.image}
                              alt={service.title}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {service.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {service.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Technician */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {technicianLabel}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 text-sky-600 dark:text-sky-400 font-semibold whitespace-nowrap">
                        ${Number(service.price || 0)}
                      </td>

                      {/* Submitted */}
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatSubmittedDate(service.createdAt)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeStyle(
                            status
                          )}`}
                        >
                          {formatStatusLabel(status)}
                        </span>
                      </td>

                      {/* Approve / Reject Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {status !== "approved" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                handleStatusChange(service, "approved")
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {status !== "rejected" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setServiceToReject(service)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/15 hover:border-rose-500/30 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Service Confirmation Modal */}
      <ConfirmModal
        open={Boolean(serviceToReject)}
        variant="warning"
        title="Reject Service?"
        description={`Are you sure you want to reject "${
          serviceToReject?.title || "this service"
        }"? It will not appear on the public service listings until approved.`}
        confirmText="Reject Service"
        cancelText="Keep"
        loading={isRejecting}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          if (!isRejecting) setServiceToReject(null);
        }}
      />
    </div>
  );
}