"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  PlusCircle,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Wrench,
  Tag,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Lock,
  Crown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPageSkeleton,
  FixMateSpinner,
} from "@/components/ui/LoadingState";

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

function resolveUserPlan(userObj) {
  if (!userObj || typeof userObj !== "object") return "free";
  if (userObj.isVerifiedPro === true) return "pro";
  return String(userObj.plan || "free").toLowerCase().trim() === "pro"
    ? "pro"
    : "free";
}

function syncUserPlanToStorage(updatedUser) {
  if (typeof window === "undefined" || !updatedUser) return;
  try {
    const raw = localStorage.getItem("user");
    const prev = raw ? JSON.parse(raw) : {};
    const resolvedPlan = resolveUserPlan(updatedUser);
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

export default function AddServicePage() {
  const router = useRouter();
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");
  const imgbbKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  const redirectTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "Smartphone",
    mode: "Home Visit",
    price: "",
    duration: "",
    area: "",
    description: "",
    image: "",
    technicianName: "",
    technicianEmail: "",
  });

  const [plan, setPlan] = useState("free");
  const [proPrice, setProPrice] = useState(19);
  const [serviceCount, setServiceCount] = useState(0);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradingPro, setUpgradingPro] = useState(false);

  const [imagePreview, setImagePreview] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const isPro = plan === "pro";
  const hasReachedFreeLimit = !isPro && serviceCount >= FREE_SERVICE_LIMIT;

  const refreshPlanAndServiceCount = useCallback(async () => {
    const token = getAuthToken();
    const parsedUser = readStoredUser();

    if (parsedUser) {
      setPlan(resolveUserPlan(parsedUser));
    }

    if (!token) {
      return {
        currentPlan: resolveUserPlan(parsedUser),
        currentCount: 0,
      };
    }

    let resolvedPlan = resolveUserPlan(parsedUser);
    let resolvedCount = 0;

    try {
      const [servicesRes, subStatusRes] = await Promise.all([
        fetch(`${apiUrl}/api/technician/services`, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null),
        fetch(`${apiUrl}/api/subscriptions/pro/status`, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => null),
      ]);

      let servicesData = null;
      if (servicesRes && servicesRes.ok) {
        servicesData = await servicesRes.json().catch(() => ({}));
        const list = Array.isArray(servicesData?.data) ? servicesData.data : [];
        const filtered = parsedUser?.email
          ? list.filter(
              (item) =>
                !item.technicianEmail ||
                item.technicianEmail.toLowerCase() ===
                  parsedUser.email.toLowerCase()
            )
          : list;
        resolvedCount = filtered.length;
        setServiceCount(resolvedCount);
      }

      if (subStatusRes && subStatusRes.ok) {
        const subData = await subStatusRes.json().catch(() => ({}));
        resolvedPlan = resolveUserPlan({
          plan: subData?.plan ?? servicesData?.plan ?? parsedUser?.plan,
          isVerifiedPro:
            subData?.isVerifiedPro ??
            subData?.user?.isVerifiedPro ??
            parsedUser?.isVerifiedPro,
        });
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
        resolvedPlan = resolveUserPlan({
          plan: servicesData?.plan ?? parsedUser?.plan,
          isVerifiedPro: parsedUser?.isVerifiedPro,
        });
      }

      setPlan(resolvedPlan);
    } catch {
      // Keep fallback state
    }

    return {
      currentPlan: resolvedPlan,
      currentCount: resolvedCount,
    };
  }, [apiUrl]);

  const syncTechnicianIdentity = useCallback(() => {
    const parsed = readStoredUser();
    if (!parsed) return;
    setFormData((prev) => ({
      ...prev,
      technicianName: parsed.name ?? prev.technicianName,
      technicianEmail: parsed.email ?? prev.technicianEmail,
    }));
    setPlan(resolveUserPlan(parsed));
  }, []);

  useEffect(() => {
    syncTechnicianIdentity();
    refreshPlanAndServiceCount();

    const handleSync = () => {
      syncTechnicianIdentity();
      refreshPlanAndServiceCount();
    };

    window.addEventListener("auth-change", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("auth-change", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [syncTechnicianIdentity, refreshPlanAndServiceCount]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

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
        throw new Error(data?.message || "Failed to upgrade to Pro.");
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

      const successMsg =
        data?.message ||
        "Upgraded to Pro! You can now add unlimited services.";
      setFeedback({ type: "success", message: successMsg });
      toast.success("Upgraded to Pro Technician Plan!");
    } catch (err) {
      const errMsg = err.message || "Could not upgrade to Pro.";
      setFeedback({ type: "error", message: errMsg });
      toast.error(errMsg);
    } finally {
      setUpgradingPro(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (feedback) setFeedback(null);
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setFeedback(null);
    setImageFailed(false);

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      const msg = "Please select a valid JPG, PNG, or WEBP image.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const msg = "Image size must be 8 MB or smaller.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);

    if (!imgbbKey) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: typeof reader.result === "string" ? reader.result : "",
        }));
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setUploadingImage(true);
      const body = new FormData();
      body.append("image", file);

      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbKey)}`,
        { method: "POST", body }
      );
      const data = await res.json();

      if (res.ok && data?.success && data?.data?.display_url) {
        setFormData((prev) => ({ ...prev, image: data.data.display_url }));
      } else {
        const msg =
          data?.error?.message || "Image upload failed. Please try again.";
        setFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      }
    } catch {
      const msg = "Network error while uploading image.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview("");
    setImageFailed(false);
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const latestState = await refreshPlanAndServiceCount();
    const activePlan = latestState?.currentPlan || plan;
    const activeCount = Math.max(latestState?.currentCount ?? 0, serviceCount);

    if (activePlan !== "pro" && activeCount >= FREE_SERVICE_LIMIT) {
      setUpgradeModalOpen(true);
      const msg =
        "Free technicians can add up to 3 services. Upgrade to Pro to add more services.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    if (!formData.title.trim()) {
      const msg = "Service title is required.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      const msg = "Please enter a valid base price greater than 0.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }
    if (!formData.area.trim()) {
      const msg = "Service area is required.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
      return;
    }
    if (!formData.description.trim()) {
      const msg = "Please provide a short service description.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }
    if (uploadingImage) {
      const msg = "Please wait until the service image finishes uploading.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    setSubmitting(true);

    const latestUser = readStoredUser();
    const techName = (
      latestUser?.name ||
      formData.technicianName ||
      ""
    ).trim();
    const techEmail = (
      latestUser?.email ||
      formData.technicianEmail ||
      ""
    ).trim();

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      mode: formData.mode,
      price: Number(formData.price),
      duration: formData.duration.trim() || "1-2 hours",
      area: formData.area.trim(),
      description: formData.description.trim(),
      image: formData.image || "",
      technicianName: techName,
      technicianEmail: techEmail,
      status: "pending",
    };

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error(
          "Please sign in as a technician to submit a service."
        );
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      let res = await fetch(`${apiUrl}/api/technician/services`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        res = await fetch(`${apiUrl}/api/services`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (
          res.status === 403 ||
          String(data?.message || "").toLowerCase().includes("limit") ||
          String(data?.message || "").toLowerCase().includes("pro")
        ) {
          setUpgradeModalOpen(true);
        }
        throw new Error(data?.message || "Failed to submit service for review.");
      }

      setServiceCount((prev) => prev + 1);

      const successMsg =
        "Service submitted for review! It will stay pending until an admin approves it.";
      setFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success("Service submitted for admin review!");

      setFormData((prev) => ({
        ...prev,
        title: "",
        price: "",
        duration: "",
        area: "",
        description: "",
        image: "",
        technicianName: techName,
        technicianEmail: techEmail,
      }));
      setImagePreview("");
      setImageFailed(false);

      redirectTimerRef.current = setTimeout(() => {
        setNavigating(true);
        router.push("/dashboard/technician/my-services");
      }, 1200);
    } catch (err) {
      const errMsg = err.message || "Something went wrong while saving service.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (navigating) {
    return <DashboardPageSkeleton />;
  }

  const previewImageSrc = !imageFailed ? formData.image || imagePreview : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Add a service
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pending Admin Approval
            </span>
            {isPro ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-400/15 text-amber-700 dark:text-amber-300 border border-amber-400/35">
                <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Verified Pro
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                Free ({serviceCount}/{FREE_SERVICE_LIMIT})
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
            New services stay pending until an admin approves them.
          </p>
        </div>

        <Link
          href="/dashboard/technician/my-services"
          onClick={() => setNavigating(true)}
          className="inline-flex items-center gap-2 self-start sm:self-auto text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl transition shadow-xs dark:shadow-none"
        >
          <ArrowLeft className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Back to My services</span>
        </Link>
      </div>

      {hasReachedFreeLimit && (
        <div className="rounded-2xl px-4 py-3.5 border bg-amber-500/10 border-amber-400/30 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              You have reached the <strong>{FREE_SERVICE_LIMIT}-service</strong>{" "}
              limit on the Free plan. Upgrade to <strong>Pro</strong> to add more
              services.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setUpgradeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3.5 border flex items-start gap-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          )}
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
      >
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Service basics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Core details customers see when browsing repairs
                </p>
              </div>
              <span className="text-xs font-mono text-sky-700 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg">
                01
              </span>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
              >
                Service title{" "}
                <span className="text-sky-600 dark:text-sky-400">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. iPhone Screen Replacement"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition cursor-pointer"
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
                <label
                  htmlFor="mode"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
                >
                  Service mode
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none transition cursor-pointer"
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
          </section>

          <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Pricing, timeline &amp; coverage
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Set transparent rates, turnaround time, and service location
                </p>
              </div>
              <span className="text-xs font-mono text-sky-700 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg">
                02
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
                >
                  Base price (USD){" "}
                  <span className="text-sky-600 dark:text-sky-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold text-sm">
                    $
                  </span>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="45"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 pl-8 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
                >
                  Estimated duration
                </label>
                <input
                  id="duration"
                  name="duration"
                  type="text"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="2-3 hours"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="area"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
              >
                Service area{" "}
                <span className="text-sky-600 dark:text-sky-400">*</span>
              </label>
              <input
                id="area"
                name="area"
                type="text"
                required
                value={formData.area}
                onChange={handleChange}
                placeholder="Mirpur, Dhaka"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
              />
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Scope &amp; technician details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Describe parts, warranty, and linked technician account
                </p>
              </div>
              <span className="text-xs font-mono text-sky-700 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg">
                03
              </span>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
              >
                Description{" "}
                <span className="text-sky-600 dark:text-sky-400">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="What the service includes, models you cover, warranty"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="technicianName"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  <span>Technician name</span>
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </label>
                <input
                  id="technicianName"
                  name="technicianName"
                  type="text"
                  readOnly
                  aria-readonly="true"
                  value={formData.technicianName}
                  placeholder="Technician name"
                  className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label
                  htmlFor="technicianEmail"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  <span>Technician email</span>
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </label>
                <input
                  id="technicianEmail"
                  name="technicianEmail"
                  type="email"
                  readOnly
                  aria-readonly="true"
                  value={formData.technicianEmail}
                  placeholder="technician@fixmate.com"
                  className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none cursor-not-allowed select-none"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Account details are locked here and can only be updated from{" "}
              <Link
                href="/dashboard/profile"
                onClick={() => setNavigating(true)}
                className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                Update profile
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 dark:text-white">
                Service image
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                JPG or PNG, up to 8 MB
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative w-full sm:w-32 h-28 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {previewImageSrc ? (
                  <>
                    <img
                      src={previewImageSrc}
                      alt="Service preview"
                      onError={() => setImageFailed(true)}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/85 dark:bg-slate-950/85 hover:bg-red-500 text-slate-200 hover:text-white flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center px-2 text-slate-400 dark:text-slate-500">
                    <ImageIcon className="w-5 h-5 mb-1 text-slate-400 dark:text-slate-600" />
                    <span className="text-xs">No image yet</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white transition cursor-pointer">
                  {uploadingImage ? (
                    <FixMateSpinner compact />
                  ) : (
                    <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  )}
                  <span>{uploadingImage ? "Uploading..." : "Upload image"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageFile}
                    disabled={uploadingImage || submitting}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Uploaded through the ImgBB step (simulated). JPG or PNG, up to 8
                  MB.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md dark:shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live listing preview
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                Pending
              </span>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 overflow-hidden">
              <div className="h-36 w-full bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center border-b border-slate-200 dark:border-slate-800/80">
                {previewImageSrc ? (
                  <img
                    src={previewImageSrc}
                    alt={formData.title || "Service preview"}
                    onError={() => setImageFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 gap-1.5">
                    <Wrench className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                    <span className="text-xs">Service visual preview</span>
                  </div>
                )}

                <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-950/85 text-sky-700 dark:text-sky-400 border border-sky-500/25 backdrop-blur-xs">
                  {formData.category}
                </span>

                <span className="absolute bottom-3 right-3 text-sm font-bold px-3 py-1 rounded-xl bg-sky-500 text-slate-950 shadow-md">
                  {formData.price ? `$${Number(formData.price)}` : "$0"}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {formData.title.trim() || "Untitled repair service"}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {formData.description.trim() ||
                      "Service scope, supported models, and warranty details will appear here."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {formData.mode}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {formData.duration.trim() || "2-3 hours"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {formData.area.trim() || "Service area"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                    {formData.technicianName.trim() || "Technician"}
                  </span>
                  <span className="text-slate-500 truncate max-w-[160px]">
                    {formData.technicianEmail.trim() || ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Status sets to{" "}
                <span className="text-amber-700 dark:text-amber-300 font-medium">
                  pending
                </span>{" "}
                upon submit.
              </p>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl transition shadow-lg shadow-sky-500/20 cursor-pointer shrink-0"
              >
                {submitting ? (
                  <FixMateSpinner compact />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                <span>{submitting ? "Submitting..." : "Submit for review"}</span>
              </button>
            </div>
          </section>
        </div>
      </form>

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
                  <span>Add unlimited repair services beyond 3</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Get Verified Pro badge on your profile &amp; services</span>
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
                Cancel
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
    </div>
  );
}