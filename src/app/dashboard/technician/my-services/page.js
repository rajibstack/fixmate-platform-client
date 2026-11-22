"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Wrench,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Crown,
  Sparkles,
  Lock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPageSkeleton,
  FixMateSpinner,
} from "@/components/ui/LoadingState";
import ConfirmModal from "@/components/ui/ConfirmModal";

const FREE_SERVICE_LIMIT = 3;

const CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "Home Appliances",
  "AC & Refrigeration",
  "Electrical",
  "Plumbing",
  "TV & Electronics",
  "Other",
];

const SERVICE_MODES = [
  "Home Visit",
  "Workshop Drop-off",
  "Pickup & Delivery",
];

function getReviewBadgeStyle(status) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "approved") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25";
  }
  if (normalized === "rejected") {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25";
  }
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25";
}

function formatReviewLabel(status) {
  const normalized = (status || "pending").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

function syncUserPlanToStorage(updatedUser) {
  if (typeof window === "undefined" || !updatedUser) return;
  try {
    const raw = localStorage.getItem("user");
    const prev = raw ? JSON.parse(raw) : {};
    const resolvedPlan =
      String(updatedUser.plan || "pro").toLowerCase() === "pro"
        ? "pro"
        : "free";
    const nextUser = {
      ...prev,
      ...updatedUser,
      plan: resolvedPlan,
      isVerifiedPro: resolvedPlan === "pro",
    };
    localStorage.setItem("user", JSON.stringify(nextUser));
    window.dispatchEvent(new Event("auth-change"));
  } catch {
    // Ignore storage errors
  }
}

function ServiceThumbnail({ src, alt }) {
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

export default function MyServicesPage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [services, setServices] = useState([]);
  const [plan, setPlan] = useState("free");
  const [proPrice, setProPrice] = useState(19);
  const [upgradingPro, setUpgradingPro] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "Smartphone",
    mode: "Home Visit",
    price: "",
    duration: "",
    area: "",
    description: "",
    image: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const isPro = plan === "pro";
  const hasReachedFreeLimit = !isPro && services.length >= FREE_SERVICE_LIMIT;

  const fetchMyServices = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
        setFeedback(null);
      }

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error(
            "Please sign in as a technician to view your services."
          );
        }

        let parsedUser = null;
        try {
          const storedUser = localStorage.getItem("user");
          parsedUser = storedUser ? JSON.parse(storedUser) : null;
        } catch {
          parsedUser = null;
        }

        const [servicesRes, subStatusRes] = await Promise.all([
          fetch(`${apiUrl}/api/technician/services`, {
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${apiUrl}/api/subscriptions/pro/status`, {
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => null),
        ]);

        const data = await servicesRes.json().catch(() => ({}));
        if (!servicesRes.ok) {
          throw new Error(data?.message || "Failed to load your services.");
        }

        const list = Array.isArray(data?.data) ? data.data : [];
        const filtered = parsedUser?.email
          ? list.filter(
              (item) =>
                !item.technicianEmail ||
                item.technicianEmail.toLowerCase() ===
                  parsedUser.email.toLowerCase()
            )
          : list;

        setServices(filtered);

        if (subStatusRes && subStatusRes.ok) {
          const subData = await subStatusRes.json().catch(() => ({}));
          const resolvedPlan =
            (subData?.plan || data?.plan || parsedUser?.plan || "free")
              .toString()
              .toLowerCase() === "pro"
              ? "pro"
              : "free";
          setPlan(resolvedPlan);
          if (subData?.price) {
            setProPrice(Number(subData.price));
          }
          if (subData?.user) {
            syncUserPlanToStorage(subData.user);
          } else {
            syncUserPlanToStorage({
              plan: resolvedPlan,
              isVerifiedPro: resolvedPlan === "pro",
            });
          }
        } else {
          const fallbackPlan =
            (data?.plan || parsedUser?.plan || "free")
              .toString()
              .toLowerCase() === "pro"
              ? "pro"
              : "free";
          setPlan(fallbackPlan);
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
    fetchMyServices();
  }, [fetchMyServices]);

  useEffect(() => {
    const handleSync = () => {
      fetchMyServices({ silent: true });
    };
    window.addEventListener("auth-change", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("auth-change", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [fetchMyServices]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const upgradeStatus = params.get("upgrade");
    const sessionId = params.get("session_id");

    if (!upgradeStatus) return;

    const cleanUrl = () => {
      const nextUrl = `${window.location.pathname}`;
      window.history.replaceState({}, "", nextUrl);
    };

    if (upgradeStatus === "cancelled") {
      toast.info("Pro upgrade checkout was cancelled.");
      cleanUrl();
      return;
    }

    if (upgradeStatus === "success") {
      const token = getAuthToken();
      if (!token) return;

      (async () => {
        try {
          const res = await fetch(`${apiUrl}/api/subscriptions/pro/confirm`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ sessionId: sessionId || "" }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            setPlan("pro");
            setUpgradeModalOpen(false);
            if (data?.user) {
              syncUserPlanToStorage(data.user);
            } else {
              syncUserPlanToStorage({ plan: "pro", isVerifiedPro: true });
            }
            const successMsg =
              "Pro Technician Plan activated! You now have unlimited listings and a Verified Pro badge.";
            setFeedback({ type: "success", message: successMsg });
            toast.success("Welcome to Pro Technician Plan!");
          }
        } catch {
          // Ignore confirmation error if already active
        } finally {
          cleanUrl();
        }
      })();
    }
  }, [apiUrl]);

  const handleConfirmUpgradeToPro = async () => {
    setUpgradingPro(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please sign in as a technician first.");
      }

      const returnUrl =
        typeof window !== "undefined" ? window.location.origin : undefined;

      const res = await fetch(
        `${apiUrl}/api/subscriptions/pro/checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ returnUrl }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to start Pro upgrade.");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setPlan("pro");
      setUpgradeModalOpen(false);
      if (data?.user) {
        syncUserPlanToStorage(data.user);
      } else {
        syncUserPlanToStorage({ plan: "pro", isVerifiedPro: true });
      }

      const msg =
        data?.message ||
        "Upgraded to Pro Technician Plan! Unlimited services & Verified Pro badge active.";
      setFeedback({ type: "success", message: msg });
      toast.success("Upgraded to Pro Technician Plan!");
    } catch (err) {
      const errMsg = err.message || "Could not upgrade to Pro.";
      setFeedback({ type: "error", message: errMsg });
      toast.error(errMsg);
    } finally {
      setUpgradingPro(false);
    }
  };

  const handleToggleAvailable = async (service) => {
    const id = service._id || service.id;
    const nextAvailable = !(service.available ?? true);

    setTogglingId(id);
    setFeedback(null);

    setServices((prev) =>
      prev.map((item) =>
        (item._id || item.id) === id
          ? { ...item, available: nextAvailable }
          : item
      )
    );

    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/api/services/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ available: nextAvailable }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update availability.");
      }

      toast.success(
        `"${service.title}" marked as ${
          nextAvailable ? "available" : "unavailable"
        }.`
      );
    } catch (err) {
      setServices((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, available: !nextAvailable }
            : item
        )
      );
      const errMsg = err.message || "Could not update availability status.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (service) => {
    setFeedback(null);
    setEditingService(service);
    setEditForm({
      title: service.title || "",
      category: service.category || "Smartphone",
      mode: service.mode || "Home Visit",
      price: service.price ?? "",
      duration: service.duration || "1-2 hours",
      area: service.area || "",
      description: service.description || "",
      image: service.image || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    const id = editingService._id || editingService.id;
    if (!editForm.title.trim() || Number(editForm.price) <= 0) {
      const msg = "Title and a valid price greater than 0 are required.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    setSavingEdit(true);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const payload = {
        title: editForm.title.trim(),
        category: editForm.category,
        mode: editForm.mode,
        price: Number(editForm.price),
        duration: editForm.duration.trim() || "1-2 hours",
        area: editForm.area.trim(),
        description: editForm.description.trim(),
        image: editForm.image.trim(),
      };

      const res = await fetch(`${apiUrl}/api/services/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update service.");
      }

      const updatedDoc = data?.data || { ...editingService, ...payload };

      setServices((prev) =>
        prev.map((item) => ((item._id || item.id) === id ? updatedDoc : item))
      );
      setEditingService(null);
      const successMsg = "Service updated successfully.";
      setFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success(successMsg);
    } catch (err) {
      const errMsg = err.message || "Error updating service.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    const id = serviceToDelete._id || serviceToDelete.id;

    setDeletingId(id);
    setFeedback(null);

    try {
      const token = getAuthToken();
      const res = await fetch(`${apiUrl}/api/services/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete service.");
      }

      setServices((prev) =>
        prev.filter((item) => (item._id || item.id) !== id)
      );
      setServiceToDelete(null);
      const successMsg = "Service deleted successfully.";
      setFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success(successMsg);
    } catch (err) {
      const errMsg = err.message || "Could not delete service.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const remainingSlots = useMemo(() => {
    if (isPro) return null;
    return Math.max(0, FREE_SERVICE_LIMIT - services.length);
  }, [isPro, services.length]);

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  const deleteTargetId = serviceToDelete?._id || serviceToDelete?.id;
  const isDeletingTarget = Boolean(
    deleteTargetId && deletingId === deleteTargetId
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              My services
            </h1>

            {isPro ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-700 dark:text-amber-300 border border-amber-400/35">
                <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Verified Pro</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                <span>
                  Free Plan ({services.length}/{FREE_SERVICE_LIMIT} services)
                </span>
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            Edit, pause or remove your listings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {!isPro && (
            <button
              type="button"
              disabled={upgradingPro}
              onClick={() => setUpgradeModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-60"
            >
              <Crown className="w-4 h-4" />
              <span>Upgrade to Pro (${proPrice}/mo)</span>
            </button>
          )}

          {hasReachedFreeLimit ? (
            <button
              type="button"
              onClick={() => setUpgradeModalOpen(true)}
              disabled={upgradingPro}
              className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-400/35 dark:border-amber-400/30 font-semibold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              <span>Limit reached (3/3) — Unlock Pro</span>
            </button>
          ) : (
            <Link
              href="/dashboard/technician/add-service"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add a service</span>
            </Link>
          )}
        </div>
      </div>

      {/* Plan Status Banner */}
      {isPro ? (
        <div className="rounded-2xl px-4 py-3.5 border bg-amber-400/10 border-amber-400/25 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Verified Pro</strong> active — you can publish unlimited
              services and display your Verified Pro badge to customers.
            </span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 shrink-0">
            Unlimited Listings
          </span>
        </div>
      ) : (
        <div
          className={`rounded-2xl px-4 py-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm ${
            hasReachedFreeLimit
              ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
              : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-xs dark:shadow-none"
          }`}
        >
          <p>
            Free plan includes up to{" "}
            <strong className="text-slate-900 dark:text-white">
              {FREE_SERVICE_LIMIT} services
            </strong>
            .{" "}
            {hasReachedFreeLimit ? (
              <span>
                You have used all {FREE_SERVICE_LIMIT} free slots. Upgrade to{" "}
                <strong className="text-amber-700 dark:text-amber-300">
                  Pro
                </strong>{" "}
                for unlimited services and a <strong>Verified Pro</strong> badge.
              </span>
            ) : (
              <span>
                You have{" "}
                <strong className="text-sky-600 dark:text-sky-400">
                  {remainingSlots} {remainingSlots === 1 ? "slot" : "slots"}
                </strong>{" "}
                remaining on the free plan.
              </span>
            )}
          </p>
          <button
            type="button"
            disabled={upgradingPro}
            onClick={() => setUpgradeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/35 text-amber-800 dark:text-amber-300 text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Go Pro</span>
          </button>
        </div>
      )}

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
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-md dark:shadow-xl overflow-hidden">
        {services.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              No services listed yet
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Create your first repair service listing to start receiving customer
              requests after admin approval.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/technician/add-service"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add a service</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/90 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40">
                  <th className="py-4 px-5">Service</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Review</th>
                  <th className="py-4 px-4">Available</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-sm">
                {services.map((service) => {
                  const id = service._id || service.id;
                  const isAvailable = service.available ?? true;
                  const isDeleting = deletingId === id;

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <ServiceThumbnail
                              src={service.image}
                              alt={service.title}
                            />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {service.title}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {service.category}
                      </td>

                      <td className="py-4 px-4 text-sky-600 dark:text-sky-400 font-semibold whitespace-nowrap">
                        ${Number(service.price || 0)}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getReviewBadgeStyle(
                            service.status
                          )}`}
                        >
                          {formatReviewLabel(service.status)}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isAvailable}
                          aria-label={`Toggle availability for ${service.title}`}
                          disabled={togglingId === id}
                          onClick={() => handleToggleAvailable(service)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
                            isAvailable
                              ? "bg-sky-500"
                              : "bg-slate-300 dark:bg-slate-700 border border-slate-400/50 dark:border-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                              isAvailable
                                ? "translate-x-6 bg-slate-950"
                                : "translate-x-1 bg-white dark:bg-slate-300"
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(service)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setServiceToDelete(service)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 dark:border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                          </button>
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

      {/* Upgrade to Pro Popup Modal */}
      {upgradeModalOpen && !isPro && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-amber-400/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-300">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Upgrade to Technician Pro
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Free plan allows up to {FREE_SERVICE_LIMIT} services.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={upgradingPro}
                onClick={() => setUpgradeModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Pro Monthly
                </span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-300">
                  ${proPrice}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    /mo
                  </span>
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Publish unlimited repair services</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Display Verified Pro badge on your profile & services</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={upgradingPro}
                onClick={() => setUpgradeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium transition cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                type="button"
                disabled={upgradingPro}
                onClick={handleConfirmUpgradeToPro}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-60"
              >
                {upgradingPro && <FixMateSpinner compact />}
                <Crown className="w-4 h-4" />
                <span>
                  {upgradingPro ? "Upgrading..." : `Upgrade Now ($${proPrice})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
      <ConfirmModal
        open={Boolean(serviceToDelete)}
        variant="danger"
        title="Delete Service?"
        description={`Are you sure you want to delete "${
          serviceToDelete?.title || "this service"
        }"? This action cannot be undone.`}
        confirmText="Delete Service"
        cancelText="Keep Service"
        loading={isDeletingTarget}
        onConfirm={handleConfirmDeleteService}
        onCancel={() => {
          if (!isDeletingTarget) setServiceToDelete(null);
        }}
      />

      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit service
              </h2>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  Service title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-slate-900 dark:text-white outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-3.5 py-2.5 text-slate-900 dark:text-white outline-none transition cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="bg-white dark:bg-slate-900"
                      >
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                    Service mode
                  </label>
                  <select
                    name="mode"
                    value={editForm.mode}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-3.5 py-2.5 text-slate-900 dark:text-white outline-none transition cursor-pointer"
                  >
                    {SERVICE_MODES.map((m) => (
                      <option
                        key={m}
                        value={m}
                        className="bg-white dark:bg-slate-900"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                    Price (USD)
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={editForm.price}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-slate-900 dark:text-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                    Estimated duration
                  </label>
                  <input
                    name="duration"
                    type="text"
                    value={editForm.duration}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-slate-900 dark:text-white outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  Service area
                </label>
                <input
                  name="area"
                  type="text"
                  value={editForm.area}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-slate-900 dark:text-white outline-none transition"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-800 dark:text-slate-200 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-slate-900 dark:text-white outline-none transition resize-y"
                />
              </div>

              {editingService.status === "approved" && (
                <p className="text-xs text-amber-800 dark:text-amber-300/90 bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 rounded-xl px-3.5 py-2.5">
                  Editing service details on an approved listing will set its
                  review status back to pending for admin re-approval.
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold disabled:opacity-60 transition shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  {savingEdit && <FixMateSpinner compact />}
                  <span>{savingEdit ? "Saving..." : "Save changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}