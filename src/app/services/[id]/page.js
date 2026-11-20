"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  MapPin,
  Clock,
  Laptop,
  UserCheck,
  Calendar,
  Phone,
  Home,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";

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

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [service, setService] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [sessionUser, setSessionUser] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [techAvatarError, setTechAvatarError] = useState(false);

  const todayStr = getTodayDateString();

  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    preferredDate: todayStr,
    problemDescription: "",
  });

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    if (type === "success") {
      sonnerToast.success(message);
    } else {
      sonnerToast.error(message);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const syncSession = useCallback(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        setSessionUser(null);
        return;
      }
      const parsed = JSON.parse(rawUser);
      setSessionUser(parsed && typeof parsed === "object" ? parsed : null);
      if (parsed?.phone || parsed?.area) {
        setFormData((prev) => ({
          ...prev,
          phone: prev.phone || parsed.phone || "",
          address: prev.address || parsed.area || "",
        }));
      }
    } catch {
      setSessionUser(null);
    }
  }, []);

  useEffect(() => {
    syncSession();
    window.addEventListener("auth-change", syncSession);
    window.addEventListener("storage", syncSession);
    return () => {
      window.removeEventListener("auth-change", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [syncSession]);

  const fetchServiceDetails = useCallback(async () => {
    if (!serviceId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      const res = await fetch(`${apiUrl}/api/services/${serviceId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const item = data?.data;
      if (!item) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const status = (item?.status || item?.approvalStatus || "approved")
        .toString()
        .toLowerCase();
      const isAvailable =
        item?.available !== false && item?.isAvailable !== false;

      if (status !== "approved" || !isAvailable) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setService(item);
      setTechnician(
        data?.technician || {
          name: item.technicianName || "Verified Technician",
          email: item.technicianEmail || "",
          avatar: "",
          area: item.area || "",
          bio: "",
        }
      );
      setTechAvatarError(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, serviceId]);

  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const role = (sessionUser?.role || "").toLowerCase();
  const isLoggedIn = Boolean(sessionUser && (sessionUser.email || sessionUser._id));
  const isCustomer = isLoggedIn && role === "customer";
  const isRestrictedStaff =
    isLoggedIn && (role === "technician" || role === "admin");

  const handleRequestButtonClick = () => {
    setFormError("");
    if (!isLoggedIn) {
      const redirectTarget = encodeURIComponent(`/services/${serviceId}`);
      setNavigating(true);
      router.push(`/sign-in?redirect=${redirectTarget}`);
      return;
    }

    if (isRestrictedStaff) {
      showToast("error", "Only customers can request a repair");
      return;
    }

    setRequestOpen(true);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();
    const trimmedDesc = formData.problemDescription.trim();

    if (!trimmedPhone) {
      setFormError("Please enter your phone number.");
      return;
    }
    if (!trimmedAddress) {
      setFormError("Please enter your service or home address.");
      return;
    }
    if (!formData.preferredDate || formData.preferredDate < todayStr) {
      setFormError("Please choose today or a future date.");
      return;
    }
    if (trimmedDesc.length < 20) {
      setFormError(
        `Problem description must be at least 20 characters (${trimmedDesc.length}/20).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          serviceId: service._id || serviceId,
          phone: trimmedPhone,
          address: trimmedAddress,
          preferredDate: formData.preferredDate,
          problemDescription: trimmedDesc,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || "Could not submit your repair request.";
        setFormError(msg);
        showToast("error", msg);
        return;
      }

      setSubmittedSuccess(true);
      setRequestOpen(false);
      setFormData((prev) => ({
        ...prev,
        problemDescription: "",
      }));
      showToast(
        "success",
        "Repair request sent! Track its status in My Bookings."
      );
    } catch {
      const msg = "Network error while submitting your request.";
      setFormError(msg);
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || navigating) {
    return <PublicPageSkeleton cards={3} />;
  }

  if (notFound || !service) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-400">
            404 • Not Found
          </p>
          <h1 className="text-2xl font-bold text-white">Service Not Found</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            The service you are looking for does not exist, is no longer
            available, or is awaiting approval.
          </p>
          <div className="pt-2">
            <Link
              href="/services"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse All Services</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const techName =
    technician?.name || service.technicianName || "Verified Technician";
  const techArea = technician?.area || service.area || "Service Area Available";
  const techBio =
    technician?.bio ||
    "Experienced FixMate specialist focused on clean diagnostics, reliable repairs, and transparent communication.";
  const showTechPhoto = Boolean(technician?.avatar) && !techAvatarError;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 sm:py-14">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-md rounded-2xl px-4 py-3.5 border shadow-2xl flex items-start gap-3 text-sm backdrop-blur ${
            toast.type === "success"
              ? "bg-slate-900/95 border-emerald-500/40 text-emerald-200"
              : "bg-slate-900/95 border-rose-500/40 text-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium leading-snug">{toast.message}</p>
            {toast.type === "success" && (
              <Link
                href="/dashboard/customer/bookings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 mt-1.5 underline underline-offset-2"
              >
                <span>Go to My Bookings</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/services"
            onClick={() => setNavigating(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-sky-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Services</span>
          </Link>
        </div>

        {/* Success Confirmation Banner with My Bookings Link */}
        {submittedSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Repair Request Submitted
                </h2>
                <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5">
                  Your booking request is now marked as{" "}
                  <span className="font-semibold">requested</span>. You can
                  view and track it anytime in My Bookings.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/customer/bookings"
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20 shrink-0"
            >
              <span>My Bookings</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Large Service Image + Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="aspect-[16/10] w-full bg-slate-950 border-b border-slate-800/80 flex items-center justify-center overflow-hidden">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Wrench className="w-14 h-14 text-sky-400/70" />
                )}
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/25 text-xs font-semibold">
                    {service.category || "General Repair"}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80 text-xs font-medium">
                    {service.mode || "Home Visit"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {service.title}
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            </div>

            {/* Technician Summary Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-400" />
                  <span>Technician Summary</span>
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                  Verified Specialist
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {showTechPhoto ? (
                  <img
                    src={technician.avatar}
                    alt={techName}
                    onError={() => setTechAvatarError(true)}
                    className="w-16 h-16 rounded-2xl object-cover border border-sky-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-lg shrink-0">
                    {getInitials(techName)}
                  </div>
                )}

                <div className="space-y-2 flex-1 min-w-0">
                  <div>
                    <h3 className="text-lg font-bold text-white truncate">
                      {techName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{techArea}</span>
                    </p>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {techBio}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Specs & Request Repair Action */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-end justify-between border-b border-slate-800/80 pb-5">
                <div>
                  <span className="text-xs font-medium text-slate-400">
                    Starting Price
                  </span>
                  <p className="text-3xl sm:text-4xl font-bold text-sky-400 mt-1">
                    ${Number(service.price || 0)}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Pay after completion
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Estimated Duration
                  </span>
                  <span className="font-semibold text-white">
                    {service.duration || "1-2 hours"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 inline-flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-sky-400" />
                    Service Mode
                  </span>
                  <span className="font-semibold text-white">
                    {service.mode || "Home Visit"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    Service Area
                  </span>
                  <span className="font-semibold text-white text-right">
                    {service.area || "Available"}
                  </span>
                </div>
              </div>

              {/* Role-Restricted Action Area */}
              <div className="space-y-3 pt-1">
                {isRestrictedStaff ? (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wide">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Customer Access Only</span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-100/90">
                      Only customers can request a repair
                    </p>
                    <button
                      type="button"
                      disabled
                      className="w-full mt-2 py-3 px-5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 font-semibold text-sm cursor-not-allowed"
                    >
                      Request Repair
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestButtonClick}
                    className="w-full py-3.5 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-sky-500/20 cursor-pointer"
                  >
                    Request Repair
                  </button>
                )}

                {!isLoggedIn && (
                  <p className="text-xs text-center text-slate-400">
                    Sign in as a customer to submit a repair request.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Repair Request Modal */}
      {requestOpen && isCustomer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  Booking Request
                </p>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  Request Repair — {service.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRequestOpen(false);
                  setFormError("");
                }}
                aria-label="Close request modal"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs sm:text-sm text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Name (Read-only)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={sessionUser?.name || ""}
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={sessionUser?.email || ""}
                    className="w-full rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="request-phone"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="request-phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleFieldChange}
                      placeholder="+880 17XX-XXXXXX"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="request-date"
                    className="block text-xs font-semibold text-slate-300 mb-1.5"
                  >
                    Preferred Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="request-date"
                      name="preferredDate"
                      type="date"
                      required
                      min={todayStr}
                      value={formData.preferredDate}
                      onChange={handleFieldChange}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 pl-10 pr-3.5 py-2.5 text-sm text-white outline-none transition [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="request-address"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Address *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    id="request-address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleFieldChange}
                    placeholder="House / Road / Area details"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="request-description"
                    className="text-xs font-semibold text-slate-300"
                  >
                    Problem Description *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Min 20 characters (
                    {formData.problemDescription.trim().length}/20)
                  </span>
                </div>
                <textarea
                  id="request-description"
                  name="problemDescription"
                  rows={4}
                  required
                  value={formData.problemDescription}
                  onChange={handleFieldChange}
                  placeholder="Describe the issue clearly (at least 20 characters)..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 p-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRequestOpen(false);
                    setFormError("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs sm:text-sm font-medium text-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? "Submitting..." : "Submit Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}