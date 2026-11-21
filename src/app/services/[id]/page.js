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
  Crown,
  Star,
  MessageSquareQuote,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";

const DEFAULT_TECH_BIO =
  "Experienced FixMate specialist focused on clean diagnostics, reliable repairs, and transparent communication.";
const DEFAULT_TECH_AREA = "Service Area Available";

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

function formatReviewDate(dateValue) {
  if (!dateValue) return "";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function resolvePlan(rawPlan, isVerifiedPro) {
  if (isVerifiedPro === true) return "pro";
  return String(rawPlan || "free").toLowerCase().trim() === "pro"
    ? "pro"
    : "free";
}

function isSameTechnician(userObj, techObj, serviceItem) {
  if (!userObj || typeof userObj !== "object") return false;

  const userEmail = String(userObj.email || "").toLowerCase().trim();
  const techEmail = String(
    techObj?.email || serviceItem?.technicianEmail || ""
  )
    .toLowerCase()
    .trim();

  if (userEmail && techEmail && userEmail === techEmail) {
    return true;
  }

  const userId = String(userObj._id || userObj.id || "").trim();
  const techId = String(
    techObj?._id || techObj?.id || serviceItem?.technicianId || ""
  ).trim();

  if (userId && techId && userId === techId) {
    return true;
  }

  return false;
}

function mergeUserIntoTechnician(baseTech, userObj, serviceItem) {
  if (!isSameTechnician(userObj, baseTech, serviceItem)) {
    return baseTech;
  }

  const nextAvatar =
    userObj.avatar !== undefined
      ? userObj.avatar
      : userObj.photo ?? userObj.profileImage ?? baseTech.avatar ?? "";

  const nextArea =
    userObj.area !== undefined && String(userObj.area).trim()
      ? String(userObj.area).trim()
      : baseTech.area || serviceItem?.area || DEFAULT_TECH_AREA;

  const nextBio =
    userObj.bio !== undefined && String(userObj.bio).trim()
      ? String(userObj.bio).trim()
      : baseTech.bio || DEFAULT_TECH_BIO;

  const nextPlan = resolvePlan(
    userObj.plan,
    userObj.isVerifiedPro ?? baseTech.isVerifiedPro
  );

  return {
    ...baseTech,
    _id: baseTech._id || userObj._id || userObj.id || "",
    name:
      (userObj.name && String(userObj.name).trim()) ||
      baseTech.name ||
      "Verified Technician",
    email: userObj.email || baseTech.email || "",
    avatar: nextAvatar,
    area: nextArea,
    bio: nextBio,
    plan: nextPlan,
    isVerifiedPro: nextPlan === "pro",
  };
}

function normalizeTechnicianData(rawData, serviceItem) {
  const nestedTech =
    (rawData?.technician && typeof rawData.technician === "object"
      ? rawData.technician
      : null) ||
    (serviceItem?.technician && typeof serviceItem.technician === "object"
      ? serviceItem.technician
      : null) ||
    (serviceItem?.technicianInfo && typeof serviceItem.technicianInfo === "object"
      ? serviceItem.technicianInfo
      : null) ||
    (serviceItem?.provider && typeof serviceItem.provider === "object"
      ? serviceItem.provider
      : null) ||
    (serviceItem?.user && typeof serviceItem.user === "object"
      ? serviceItem.user
      : null) ||
    {};

  const name =
    nestedTech.name ||
    nestedTech.fullName ||
    rawData?.technicianName ||
    serviceItem?.technicianName ||
    serviceItem?.providerName ||
    "Verified Technician";

  const email =
    nestedTech.email ||
    rawData?.technicianEmail ||
    serviceItem?.technicianEmail ||
    "";

  const avatar =
    nestedTech.avatar ||
    nestedTech.photo ||
    nestedTech.photoURL ||
    nestedTech.profileImage ||
    nestedTech.image ||
    rawData?.technicianAvatar ||
    serviceItem?.technicianAvatar ||
    "";

  const area =
    (nestedTech.area && String(nestedTech.area).trim()) ||
    (nestedTech.serviceArea && String(nestedTech.serviceArea).trim()) ||
    (nestedTech.location && String(nestedTech.location).trim()) ||
    (nestedTech.address && String(nestedTech.address).trim()) ||
    (serviceItem?.area && String(serviceItem.area).trim()) ||
    (serviceItem?.serviceArea && String(serviceItem.serviceArea).trim()) ||
    DEFAULT_TECH_AREA;

  const bio =
    (nestedTech.bio && String(nestedTech.bio).trim()) ||
    (nestedTech.about && String(nestedTech.about).trim()) ||
    (nestedTech.description && String(nestedTech.description).trim()) ||
    (nestedTech.specialty && String(nestedTech.specialty).trim()) ||
    (rawData?.technicianBio && String(rawData.technicianBio).trim()) ||
    (serviceItem?.technicianBio && String(serviceItem.technicianBio).trim()) ||
    DEFAULT_TECH_BIO;

  const id =
    nestedTech._id ||
    nestedTech.id ||
    serviceItem?.technicianId ||
    serviceItem?.userId ||
    "";

  const plan = resolvePlan(
    nestedTech.plan ??
      rawData?.technicianPlan ??
      serviceItem?.technicianPlan,
    nestedTech.isVerifiedPro ??
      rawData?.isVerifiedPro ??
      serviceItem?.isVerifiedPro
  );

  return {
    _id: id,
    name,
    email,
    avatar,
    area,
    bio,
    plan,
    isVerifiedPro: plan === "pro",
  };
}

function computeRatingStats(reviewList = []) {
  const valid = Array.isArray(reviewList)
    ? reviewList
        .map((r) => ({
          ...r,
          rating: Number(r?.rating ?? r?.reviewRating ?? r?.stars ?? 0),
          review: String(
            r?.review ?? r?.reviewText ?? r?.comment ?? ""
          ).trim(),
        }))
        .filter(
          (r) => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5
        )
    : [];

  const count = valid.length;
  if (count === 0) {
    return { averageRating: 0, reviewCount: 0, reviews: [] };
  }

  const sum = valid.reduce((acc, item) => acc + item.rating, 0);
  return {
    averageRating: Number((sum / count).toFixed(1)),
    reviewCount: count,
    reviews: valid,
  };
}

export default function ServiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const serviceId = rawId ? String(rawId).trim() : "";
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [service, setService] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [sessionUser, setSessionUser] = useState(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [serviceImageError, setServiceImageError] = useState(false);
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

  const syncCustomerBookingReviews = useCallback(
    async (targetServiceId, currentReviews = [], currentUserObj = null) => {
      const token = getAuthToken();
      if (!token || !targetServiceId) {
        return computeRatingStats(currentReviews);
      }

      const roleLower = String(currentUserObj?.role || "").toLowerCase();
      if (roleLower && roleLower !== "customer") {
        return computeRatingStats(currentReviews);
      }

      try {
        const res = await fetch(`${apiUrl}/api/bookings/my`, {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          return computeRatingStats(currentReviews);
        }

        const data = await res.json().catch(() => ({}));
        const allBookings = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        const reviewedMatchingBookings = allBookings.filter((b) => {
          const bServiceId = String(
            b?.serviceId?._id ||
              b?.serviceId ||
              b?.service?._id ||
              b?.service ||
              ""
          ).trim();
          const rating = Number(b?.rating ?? b?.reviewRating ?? b?.stars ?? 0);
          return (
            bServiceId === String(targetServiceId).trim() &&
            Number.isFinite(rating) &&
            rating >= 1 &&
            rating <= 5
          );
        });

        if (reviewedMatchingBookings.length > 0) {
          const mergedMap = new Map();
          for (const r of currentReviews) {
            const rId = String(r?._id || r?.id || r?.bookingId || "");
            if (rId) mergedMap.set(rId, r);
          }

          for (const b of reviewedMatchingBookings) {
            const bId = String(b._id || b.id);
            const rating = Math.round(
              Number(b?.rating ?? b?.reviewRating ?? b?.stars ?? 0)
            );
            const reviewText = String(
              b?.review ?? b?.reviewText ?? b?.comment ?? ""
            ).trim();
            mergedMap.set(bId, {
              _id: bId,
              bookingId: bId,
              rating,
              review: reviewText,
              customerName:
                b?.customerName || currentUserObj?.name || "Customer",
              reviewedAt:
                b?.reviewedAt || b?.updatedAt || new Date().toISOString(),
            });
          }

          return computeRatingStats(Array.from(mergedMap.values()));
        }
      } catch {
        // Ignore booking sync failure
      }

      return computeRatingStats(currentReviews);
    },
    [apiUrl]
  );

  const fetchServiceDetails = useCallback(
    async ({ silent = false } = {}) => {
      if (!serviceId) {
        if (!silent) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      if (!silent) {
        setLoading(true);
        setNotFound(false);
      }

      try {
        const res = await fetch(`${apiUrl}/api/services/${serviceId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!silent) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const data = await res.json().catch(() => ({}));
        const item =
          data?.data && typeof data.data === "object"
            ? data.data
            : data?.service && typeof data.service === "object"
            ? data.service
            : null;

        if (!item) {
          if (!silent) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const status = (item?.status || item?.approvalStatus || "approved")
          .toString()
          .toLowerCase();
        const isAvailable =
          item?.available !== false && item?.isAvailable !== false;

        if (status !== "approved" || !isAvailable) {
          if (!silent) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const incomingReviews = Array.isArray(data?.reviews)
          ? data.reviews
          : Array.isArray(item?.reviews)
          ? item.reviews
          : [];

        let localUser = null;
        let normalizedTech = normalizeTechnicianData(data, item);

        if (typeof window !== "undefined") {
          try {
            const rawUser = localStorage.getItem("user");
            const validUser = rawUser ? JSON.parse(rawUser) : null;
            if (validUser && typeof validUser === "object") {
              localUser = validUser;
              normalizedTech = mergeUserIntoTechnician(
                normalizedTech,
                validUser,
                item
              );
            }
          } catch {
            // Ignore storage parse error
          }

          const token = getAuthToken();
          if (
            token &&
            isSameTechnician(
              {
                email: normalizedTech.email,
                _id: normalizedTech._id,
              },
              normalizedTech,
              item
            )
          ) {
            try {
              const meRes = await fetch(`${apiUrl}/api/auth/me`, {
                cache: "no-store",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (meRes.ok) {
                const meJson = await meRes.json().catch(() => ({}));
                const meUser = meJson?.user || meJson?.data || null;
                if (meUser && typeof meUser === "object") {
                  normalizedTech = mergeUserIntoTechnician(
                    normalizedTech,
                    meUser,
                    item
                  );
                  const existingRaw = localStorage.getItem("user");
                  const existingObj = existingRaw
                    ? JSON.parse(existingRaw)
                    : {};
                  localStorage.setItem(
                    "user",
                    JSON.stringify({ ...existingObj, ...meUser })
                  );
                }
              }
            } catch {
              // Ignore live /api/auth/me sync error
            }
          }
        }

        const syncedStats = await syncCustomerBookingReviews(
          serviceId,
          incomingReviews,
          localUser
        );

        const backendCount = Number(data?.reviewCount ?? item?.reviewCount ?? 0);
        const backendAvg = Number(data?.averageRating ?? item?.averageRating ?? 0);

        const finalReviews =
          syncedStats.reviewCount > 0 ? syncedStats.reviews : incomingReviews;
        const finalCount =
          syncedStats.reviewCount > 0 ? syncedStats.reviewCount : backendCount;
        const finalAvg =
          syncedStats.reviewCount > 0
            ? syncedStats.averageRating
            : Number.isFinite(backendAvg)
            ? Number(backendAvg.toFixed(1))
            : 0;

        setService(item);
        setTechnician(normalizedTech);
        setReviews(finalReviews);
        setReviewCount(finalCount);
        setAverageRating(finalAvg);
        setServiceImageError(false);
        setTechAvatarError(false);
      } catch {
        if (!silent) {
          setNotFound(true);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [apiUrl, serviceId, syncCustomerBookingReviews]
  );

  const syncSession = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        setSessionUser(null);
      } else {
        const parsed = JSON.parse(rawUser);
        const validUser = parsed && typeof parsed === "object" ? parsed : null;
        setSessionUser(validUser);

        if (validUser) {
          setFormData((prev) => ({
            ...prev,
            phone: validUser.phone || prev.phone || "",
            address: validUser.area || prev.address || "",
          }));
        }
      }
    } catch {
      setSessionUser(null);
    }
    fetchServiceDetails({ silent: true });
  }, [fetchServiceDetails]);

  useEffect(() => {
    syncSession();
    const handleFocusOrVisible = () => {
      if (
        document.visibilityState === "visible" ||
        document.hasFocus()
      ) {
        fetchServiceDetails({ silent: true });
      }
    };

    window.addEventListener("auth-change", syncSession);
    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", handleFocusOrVisible);
    window.addEventListener("pageshow", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("auth-change", syncSession);
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", handleFocusOrVisible);
      window.removeEventListener("pageshow", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [syncSession, fetchServiceDetails]);

  useEffect(() => {
    fetchServiceDetails();
  }, [fetchServiceDetails]);

  const role = (sessionUser?.role || "").toLowerCase();
  const isLoggedIn = Boolean(
    sessionUser && (sessionUser.email || sessionUser._id || sessionUser.id)
  );
  const isRestrictedStaff =
    isLoggedIn && (role === "technician" || role === "admin");

  const handleRequestButtonClick = () => {
    setFormError("");
    const token = getAuthToken();
    if (!isLoggedIn || !token) {
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
      const token = getAuthToken();
      if (!token) {
        setRequestOpen(false);
        const redirectTarget = encodeURIComponent(`/services/${serviceId}`);
        setNavigating(true);
        router.push(`/sign-in?redirect=${redirectTarget}`);
        return;
      }

      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: service._id || service.id || serviceId,
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

  const modeLabel = service.mode || service.serviceMode || "Home Visit";
  const areaLabel =
    service.area || service.serviceArea || DEFAULT_TECH_AREA;
  const durationLabel =
    service.duration || service.estimatedDuration || "1-2 hours";
  const serviceImageUrl =
    service.image || service.thumbnail || service.photo || "";

  const techName =
    technician?.name || service.technicianName || "Verified Technician";
  const techArea = technician?.area || areaLabel;
  const techBio = technician?.bio || DEFAULT_TECH_BIO;
  const isProTechnician = Boolean(
    technician?.isVerifiedPro || technician?.plan === "pro"
  );

  const showServicePhoto = Boolean(serviceImageUrl) && !serviceImageError;
  const showTechPhoto = Boolean(technician?.avatar) && !techAvatarError;
  const filledStarsCount = Math.round(averageRating);

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
          {/* Left Column: Large Service Image + Description + Technician + Reviews */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="aspect-[16/10] w-full bg-slate-950 border-b border-slate-800/80 flex items-center justify-center overflow-hidden">
                {showServicePhoto ? (
                  <img
                    src={serviceImageUrl}
                    alt={service.title}
                    onError={() => setServiceImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Wrench className="w-14 h-14 text-sky-400/70" />
                )}
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/25 text-xs font-semibold">
                      {service.category || "General Repair"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80 text-xs font-medium">
                      {modeLabel}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>
                      {reviewCount > 0
                        ? `${averageRating.toFixed(1)} (${reviewCount} ${
                            reviewCount === 1 ? "review" : "reviews"
                          })`
                        : "No ratings yet"}
                    </span>
                  </div>
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

                {isProTechnician ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/35">
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Verified Pro</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                    Verified Specialist
                  </span>
                )}
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

                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {techBio}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Ratings & Reviews Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-amber-400" />
                  <span>Customer Reviews</span>
                </h2>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= filledStarsCount
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-white">
                    {reviewCount > 0 ? `${averageRating.toFixed(1)}/5` : "0.0/5"}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({reviewCount})
                  </span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No customer reviews yet.
                </p>
              ) : (
                <div className="space-y-3.5">
                  {reviews.map((item, index) => {
                    const itemRating = Math.min(
                      5,
                      Math.max(1, Number(item?.rating || 5))
                    );
                    const formattedDate = formatReviewDate(item?.reviewedAt);
                    return (
                      <div
                        key={item?._id || item?.bookingId || index}
                        className="rounded-2xl bg-slate-950/75 border border-slate-800/90 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold text-white">
                              {item?.customerName || "Customer"}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= itemRating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-700"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {formattedDate && (
                            <span className="text-[11px] text-slate-500">
                              {formattedDate}
                            </span>
                          )}
                        </div>
                        {item?.review && (
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            “{item.review}”
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                <div className="text-right space-y-1">
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>
                      {reviewCount > 0
                        ? `${averageRating.toFixed(1)} (${reviewCount})`
                        : "New"}
                    </span>
                  </div>
                  <span className="block text-xs text-slate-400">
                    Pay after completion
                  </span>
                </div>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-400" />
                    Estimated Duration
                  </span>
                  <span className="font-semibold text-white">
                    {durationLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 inline-flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-sky-400" />
                    Service Mode
                  </span>
                  <span className="font-semibold text-white">{modeLabel}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    Service Area
                  </span>
                  <span className="font-semibold text-white text-right">
                    {areaLabel}
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
      {requestOpen && role === "customer" && (
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