"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Wrench,
  Send,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Laptop,
  Wind,
  Refrigerator,
  Tv,
  WashingMachine,
  Zap,
  Clock,
  Award,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  RefreshCw,
} from "lucide-react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";

const HERO_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1000&q=80";

const POPULAR_CATEGORIES = [
  {
    name: "Smartphone",
    queryValue: "Smartphone",
    icon: Smartphone,
    tagline: "Screens, battery, charging & board fix",
  },
  {
    name: "Laptop & PC",
    queryValue: "Laptop & PC",
    icon: Laptop,
    tagline: "Display, SSD, thermal & OS tune-up",
  },
  {
    name: "AC",
    queryValue: "AC & Refrigeration",
    icon: Wind,
    tagline: "Cooling check, gas recharge & PCB",
  },
  {
    name: "Refrigerator",
    queryValue: "AC & Refrigeration",
    icon: Refrigerator,
    tagline: "Compressor, thermostat & defrost fix",
  },
  {
    name: "TV",
    queryValue: "TV & Electronics",
    icon: Tv,
    tagline: "Panel backlight, audio & mainboard",
  },
  {
    name: "Washing Machine",
    queryValue: "Home Appliances",
    icon: WashingMachine,
    tagline: "Drum motor, drainage & spin repair",
  },
  {
    name: "Electrical",
    queryValue: "Electrical",
    icon: Zap,
    tagline: "Wiring, switchboard, inverter & safety",
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Find a Service",
    description:
      "Browse verified repair listings by device category, service mode, and transparent starting price.",
    icon: Search,
  },
  {
    step: "02",
    title: "Send a Request",
    description:
      "Pick a convenient time slot and share your device issue or home visit details in seconds.",
    icon: Send,
  },
  {
    step: "03",
    title: "Technician Fixes It",
    description:
      "A vetted technician diagnoses the fault and completes the repair using reliable parts.",
    icon: Wrench,
  },
  {
    step: "04",
    title: "Pay After Completion",
    description:
      "Inspect your working device first and pay only once the repair job is finished to your satisfaction.",
    icon: CheckCircle2,
  },
];

const WHY_CHOOSE_STATS = [
  {
    value: "1,200+",
    label: "Verified Technicians",
    description: "Background-checked specialists across major repair categories.",
    icon: ShieldCheck,
  },
  {
    value: "18,500+",
    label: "Jobs Completed",
    description: "Devices and home appliances restored smoothly with clear pricing.",
    icon: Award,
  },
  {
    value: "Pay After Service",
    label: "Zero Upfront Stress",
    description: "Settle payment only after testing and confirming the repair.",
    icon: Clock,
  },
];

function isServiceApprovedAndAvailable(service) {
  const status = (service?.status || service?.approvalStatus || "approved")
    .toString()
    .toLowerCase();
  const isApproved = status === "approved";
  const isAvailable =
    service?.available !== false && service?.isAvailable !== false;
  return isApproved && isAvailable;
}

function matchesCategoryFilter(service, selectedCategoryName) {
  if (!selectedCategoryName) return true;
  const catObj = POPULAR_CATEGORIES.find((c) => c.name === selectedCategoryName);
  const queryVal = (catObj?.queryValue || selectedCategoryName).toLowerCase();
  const target = selectedCategoryName.toLowerCase();

  const cat = (service?.category || "").toLowerCase();
  const title = (service?.title || "").toLowerCase();

  if (target === "ac") {
    return (
      cat.includes("ac") ||
      cat.includes("refrigeration") ||
      title.includes("ac")
    );
  }
  if (target === "refrigerator") {
    return (
      cat.includes("refrigerator") ||
      cat.includes("ac & refrigeration") ||
      title.includes("fridge") ||
      title.includes("refrigerator")
    );
  }
  if (target === "tv") {
    return (
      cat.includes("tv") ||
      cat.includes("electronics") ||
      title.includes("tv")
    );
  }
  if (target === "washing machine") {
    return (
      cat.includes("washing") ||
      cat.includes("home appliances") ||
      title.includes("washing")
    );
  }
  return (
    cat.includes(queryVal) ||
    cat.includes(target) ||
    title.includes(target)
  );
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

function resolveTechnicianName(service, currentUser) {
  const srvTechId = String(
    service?.technicianId ||
      service?.technician?._id ||
      service?.technician?.id ||
      ""
  ).trim();
  const userId = String(currentUser?._id || currentUser?.id || "").trim();

  const srvTechEmail = String(
    service?.technicianEmail || service?.technician?.email || ""
  )
    .trim()
    .toLowerCase();
  const userEmail = String(currentUser?.email || "")
    .trim()
    .toLowerCase();

  const isOwnService = Boolean(
    currentUser?.name &&
      ((srvTechId && userId && srvTechId === userId) ||
        (srvTechEmail && userEmail && srvTechEmail === userEmail))
  );

  if (isOwnService) {
    return currentUser.name;
  }

  return (
    service?.technicianName ||
    service?.technician?.name ||
    "Verified Technician"
  );
}

function normalizeReviewItem(raw, fallbackServiceTitle = "", index = 0) {
  const customerObj =
    raw?.customer && typeof raw.customer === "object"
      ? raw.customer
      : raw?.user && typeof raw.user === "object"
      ? raw.user
      : null;

  const customerName = String(
    raw?.customerName ||
      raw?.reviewerName ||
      raw?.userName ||
      raw?.name ||
      customerObj?.name ||
      customerObj?.fullName ||
      "Verified Customer"
  ).trim();

  const customerImage = String(
    raw?.customerImage ||
      raw?.customerAvatar ||
      raw?.avatar ||
      raw?.userImage ||
      raw?.photoURL ||
      raw?.photo ||
      customerObj?.avatar ||
      customerObj?.image ||
      customerObj?.photoURL ||
      customerObj?.photo ||
      ""
  ).trim();

  const numericRating = Number(
    raw?.rating ?? raw?.stars ?? raw?.score ?? raw?.reviewRating ?? 5
  );
  const rating = Number.isFinite(numericRating)
    ? Math.min(5, Math.max(1, Math.round(numericRating * 10) / 10))
    : 5;

  const comment = String(
    raw?.comment ||
      raw?.review ||
      raw?.feedback ||
      raw?.message ||
      raw?.description ||
      raw?.text ||
      ""
  ).trim();

  const serviceTitle = String(
    raw?.serviceTitle ||
      raw?.service?.title ||
      raw?.serviceName ||
      fallbackServiceTitle ||
      "Repair Service"
  ).trim();

  const updatedAtRaw =
    raw?.updatedAt ||
    raw?.editedAt ||
    raw?.modifiedAt ||
    raw?.createdAt ||
    raw?.date ||
    "";
  const timestamp = updatedAtRaw ? new Date(updatedAtRaw).getTime() : 0;
  const isEdited = Boolean(
    raw?.isEdited ||
      raw?.updated ||
      (raw?.updatedAt &&
        raw?.createdAt &&
        new Date(raw.updatedAt).getTime() > new Date(raw.createdAt).getTime())
  );

  const id = String(
    raw?._id ||
      raw?.id ||
      raw?.reviewId ||
      `rev-${customerName}-${timestamp || index}`
  );

  return {
    id,
    customerName,
    customerImage,
    rating,
    comment,
    serviceTitle,
    timestamp: Number.isFinite(timestamp) ? timestamp : 0,
    isEdited,
  };
}

function extractReviewsFromPayload(payload) {
  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.reviews)
    ? payload.reviews
    : Array.isArray(payload)
    ? payload
    : [];

  return list
    .map((item, idx) => normalizeReviewItem(item, "", idx))
    .filter((item) => item.comment.length > 0);
}

function extractReviewsFromServices(servicesList) {
  if (!Array.isArray(servicesList)) return [];
  const collected = [];

  servicesList.forEach((srv, sIdx) => {
    const srvTitle = srv?.title || srv?.serviceTitle || "Repair Service";
    const srvReviews = Array.isArray(srv?.reviews)
      ? srv.reviews
      : Array.isArray(srv?.ratings)
      ? srv.ratings
      : [];

    srvReviews.forEach((rev, rIdx) => {
      const normalized = normalizeReviewItem(
        rev,
        srvTitle,
        `${sIdx}-${rIdx}`
      );
      if (normalized.comment) {
        collected.push(normalized);
      }
    });
  });

  return collected;
}

function FeaturedServiceImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <Wrench className="w-9 h-9 text-sky-500 dark:text-sky-400/70" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  );
}

function ReviewerAvatar({ src, name }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const initials = useMemo(() => {
    const parts = String(name || "C")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "C";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [name]);

  if (!src || failed) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-bold text-sm flex items-center justify-center shrink-0 select-none">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
    />
  );
}

function RatingStars({ rating }) {
  const rounded = Math.round(Number(rating) || 5);

  return (
    <div
      className="inline-flex items-center gap-1"
      aria-label={`Rating ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const filled = starIndex <= rounded;
        return (
          <Star
            key={starIndex}
            className={`w-4 h-4 ${
              filled
                ? "text-amber-400 fill-amber-400"
                : "text-slate-300 dark:text-slate-700"
            }`}
          />
        );
      })}
      <span className="ml-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
        {Number(rating || 5).toFixed(1)}
      </span>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allServices, setAllServices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [heroImgSrc, setHeroImgSrc] = useState(HERO_FALLBACK_IMAGE);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  const fetchFeaturedServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/api/services`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load services.");
      }

      const rawList = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      const approvedAvailable = rawList
        .filter(isServiceApprovedAndAvailable)
        .sort(
          (a, b) =>
            new Date(b?.createdAt || 0).getTime() -
            new Date(a?.createdAt || 0).getTime()
        );

      setAllServices(approvedAvailable);

      const embeddedReviews = extractReviewsFromServices(rawList);
      if (embeddedReviews.length > 0) {
        const sortedEmbedded = [...embeddedReviews].sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        );
        setReviews((prev) => (prev.length === 0 ? sortedEmbedded : prev));
      }
    } catch (err) {
      setError(err.message || "Could not load featured services.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const fetchDynamicReviews = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setReviewsLoading(true);
      }
      setReviewsError("");

      try {
        const res = await fetch(`${apiUrl}/api/reviews?_t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const parsedReviews = extractReviewsFromPayload(data).sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          );
          setReviews(parsedReviews);
          return;
        }

        const fallbackRes = await fetch(`${apiUrl}/api/services?_t=${Date.now()}`, {
          cache: "no-store",
        });
        const fallbackData = await fallbackRes.json().catch(() => ({}));
        if (!fallbackRes.ok) {
          throw new Error(fallbackData?.message || "Failed to load reviews.");
        }

        const srvList = Array.isArray(fallbackData?.data)
          ? fallbackData.data
          : Array.isArray(fallbackData)
          ? fallbackData
          : [];

        const fromServices = extractReviewsFromServices(srvList).sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
        );
        setReviews(fromServices);
      } catch (err) {
        if (!silent) {
          setReviewsError(err.message || "Could not load customer reviews.");
        }
      } finally {
        if (!silent) {
          setReviewsLoading(false);
        }
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchFeaturedServices();
    fetchDynamicReviews();
  }, [fetchFeaturedServices, fetchDynamicReviews]);

  useEffect(() => {
    const syncReviewsOnUpdate = () => {
      fetchDynamicReviews({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDynamicReviews({ silent: true });
      }
    };

    window.addEventListener("focus", syncReviewsOnUpdate);
    window.addEventListener("reviews-updated", syncReviewsOnUpdate);
    window.addEventListener("storage", syncReviewsOnUpdate);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDynamicReviews({ silent: true });
      }
    }, 15000);

    return () => {
      window.removeEventListener("focus", syncReviewsOnUpdate);
      window.removeEventListener("reviews-updated", syncReviewsOnUpdate);
      window.removeEventListener("storage", syncReviewsOnUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [fetchDynamicReviews]);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const maxSlideIndex = useMemo(() => {
    if (reviews.length <= cardsPerView) return 0;
    return Math.max(0, reviews.length - cardsPerView);
  }, [reviews.length, cardsPerView]);

  useEffect(() => {
    setSlideIndex((prev) => Math.min(prev, maxSlideIndex));
  }, [maxSlideIndex]);

  useEffect(() => {
    if (isPaused || maxSlideIndex <= 0) return;

    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isPaused, maxSlideIndex]);

  const visibleReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    if (reviews.length <= cardsPerView) return reviews;
    return reviews.slice(slideIndex, slideIndex + cardsPerView);
  }, [reviews, slideIndex, cardsPerView]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, item) => acc + (Number(item.rating) || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  useEffect(() => {
    setCurrentUser(readStoredUser());

    const handleSessionOrProfileChange = () => {
      setCurrentUser(readStoredUser());
    };

    window.addEventListener("auth-change", handleSessionOrProfileChange);
    window.addEventListener("storage", handleSessionOrProfileChange);

    return () => {
      window.removeEventListener("auth-change", handleSessionOrProfileChange);
      window.removeEventListener("storage", handleSessionOrProfileChange);
    };
  }, []);

  const featuredServices = useMemo(() => {
    const filtered = selectedCategory
      ? allServices.filter((item) =>
          matchesCategoryFilter(item, selectedCategory)
        )
      : allServices;
    return filtered.slice(0, 6);
  }, [allServices, selectedCategory]);

  const selectedCategoryQueryValue = useMemo(() => {
    if (!selectedCategory) return "";
    const found = POPULAR_CATEGORIES.find((c) => c.name === selectedCategory);
    return found?.queryValue || selectedCategory;
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setNavigating(true);
    if (trimmed) {
      router.push(`/services?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/services");
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory((prev) => (prev === categoryName ? "" : categoryName));
    const section = document.getElementById("featured-services");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrevSlide = () => {
    if (maxSlideIndex <= 0) return;
    setSlideIndex((prev) => (prev <= 0 ? maxSlideIndex : prev - 1));
  };

  const handleNextSlide = () => {
    if (maxSlideIndex <= 0) return;
    setSlideIndex((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
  };

  if (navigating) {
    return <PublicPageSkeleton cards={6} />;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Hero / Banner Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-transparent">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[340px] rounded-full bg-sky-500/10 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 lg:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>On-Demand Device & Appliance Repair</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Broken Device? Get It Fixed by{" "}
                <span className="text-sky-600 dark:text-sky-400">
                  Verified Technicians
                </span>
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
                Book trusted repair specialists for smartphones, laptops, ACs,
                fridges, TVs, and home appliances with upfront starting prices
                and pay-after-completion peace of mind.
              </p>

              {/* Search + Primary CTA */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row gap-3 pt-1 max-w-2xl"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search AC repair, laptop screen, fridge..."
                    className="w-full rounded-xl bg-white dark:bg-slate-900/95 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-5 py-3 rounded-xl transition shadow-lg shadow-sky-500/20 cursor-pointer shrink-0"
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/services"
                  onClick={() => setNavigating(true)}
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm px-5 py-3 rounded-xl transition shrink-0"
                >
                  <span>Explore Services</span>
                </Link>
              </form>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  Verified specialists
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  Transparent starting prices
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  Pay after completion
                </span>
              </div>
            </div>

            {/* Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl dark:shadow-2xl space-y-5">
                <div className="aspect-[16/10] w-full rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={heroImgSrc}
                    alt="Technician repairing electronics with precision tools"
                    onError={() => {
                      if (heroImgSrc !== HERO_FALLBACK_IMAGE) {
                        setHeroImgSrc(HERO_FALLBACK_IMAGE);
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 backdrop-blur-xs">
                      Same-Day Slot Available
                    </span>
                    <span className="text-xs font-medium text-slate-100 bg-slate-900/85 px-3 py-1 rounded-full border border-slate-700/80">
                      {averageRating ? `${averageRating} ★ Rating` : "4.9 ★ Rating"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Turnaround
                    </p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      Fast & Reliable
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Service Modes
                    </p>
                    <p className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">
                      Home & Workshop
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dynamic Featured Services Section */}
      <section
        id="featured-services"
        className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-16 space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Featured Listings
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              {selectedCategory
                ? `${selectedCategory} Services`
                : "Latest Approved Services"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Available services vetted for quality and ready to book.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Clear filter
              </button>
            )}
            <Link
              href={
                selectedCategoryQueryValue
                  ? `/services?category=${encodeURIComponent(
                      selectedCategoryQueryValue
                    )}`
                  : "/services"
              }
              onClick={() => setNavigating(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition"
            >
              <span>View All Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <PublicPageSkeleton cards={6} />
        ) : error ? (
          <div className="py-12 px-6 text-center bg-white dark:bg-slate-900/90 border border-rose-500/30 rounded-3xl space-y-3">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchFeaturedServices}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : featuredServices.length === 0 ? (
          <div className="py-14 px-6 text-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching services found
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {selectedCategory
                ? `No approved and available services matched "${selectedCategory}".`
                : "Approved and available repair services will appear here soon."}
            </p>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition cursor-pointer"
              >
                Show All Featured
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service) => {
              const id = service._id || service.id;
              const modeLabel =
                service.mode || service.serviceMode || "Home Visit";
              const techName = resolveTechnicianName(service, currentUser);

              return (
                <article
                  key={id}
                  className="h-full flex flex-col justify-between bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 rounded-3xl overflow-hidden shadow-md dark:shadow-xl transition"
                >
                  <div>
                    <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 overflow-hidden flex items-center justify-center">
                      <FeaturedServiceImage
                        src={service.image}
                        alt={service.title || "Repair Service"}
                      />
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 font-semibold truncate">
                          {service.category || "General Repair"}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
                          {modeLabel}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                        {service.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Technician:{" "}
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {techName}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-200 dark:border-slate-800/70 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        Starting at
                      </span>
                      <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                        ${Number(service.price || 0)}
                      </span>
                    </div>

                    <Link
                      href={`/services/${id}`}
                      onClick={() => setNavigating(true)}
                      className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-500/15 shrink-0"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Extra Section 1: How FixMate Works */}
      <section className="border-y border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/40 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Simple Process
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              How FixMate Works
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">
              Four straightforward steps from booking to a working device.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS_STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="h-full flex flex-col justify-between bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md dark:shadow-lg relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500">
                        STEP {item.step}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/70 flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400/90">
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Extra Section 2: Popular Categories & Why Choose Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-14 sm:py-16 space-y-12">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Categories
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Popular Repair Categories
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Click a category to filter featured services below.
              </p>
            </div>

            <Link
              href="/services"
              onClick={() => setNavigating(true)}
              className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Browse all categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {POPULAR_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`text-left h-full flex flex-col justify-between rounded-2xl p-5 border transition cursor-pointer ${
                    isSelected
                      ? "bg-sky-500/15 border-sky-500 text-slate-900 dark:text-white shadow-lg shadow-sky-500/10"
                      : "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-sky-500/40 text-slate-900 dark:text-slate-100"
                  }`}
                >
                  <div className="space-y-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isSelected
                          ? "bg-sky-500 text-slate-950 border-sky-400"
                          : "bg-slate-100 dark:bg-slate-950 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {cat.tagline}
                      </p>
                    </div>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                    <span>{isSelected ? "Selected" : "Filter services"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us / Platform Trust Stats */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg dark:shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Why Choose FixMate
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Built on Trust, Speed & Accountability
              </h2>
            </div>
            <Link
              href="/services"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20 self-start sm:self-auto"
            >
              <span>Book a Repair</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WHY_CHOOSE_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-5 space-y-2.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-600 dark:text-sky-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Dynamic Sliding Customer Reviews Section */}
      <section
        id="customer-reviews"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/40 py-14 sm:py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Customer Feedback
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                What Customers Say About FixMate
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Live reviews from real repair bookings — automatically synced
                when updated.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {averageRating && reviews.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-xs">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{averageRating}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    ({reviews.length})
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => fetchDynamicReviews({ silent: false })}
                aria-label="Refresh reviews"
                title="Refresh reviews"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${reviewsLoading ? "animate-spin text-sky-500" : ""}`}
                />
              </button>

              {maxSlideIndex > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Previous reviews"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Next reviews"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition shadow-md shadow-sky-500/20 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {reviewsLoading && reviews.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((skeletonCard) => (
                <div
                  key={skeletonCard}
                  className="h-64 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : reviewsError && reviews.length === 0 ? (
            <div className="py-12 px-6 text-center bg-white dark:bg-slate-900/90 border border-rose-500/30 rounded-3xl space-y-3">
              <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
                {reviewsError}
              </p>
              <button
                type="button"
                onClick={() => fetchDynamicReviews({ silent: false })}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition cursor-pointer"
              >
                Retry Loading Reviews
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-14 px-6 text-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Quote className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No customer reviews yet
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Customer ratings and review comments will appear here
                automatically as soon as reviews are submitted or updated.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleReviews.map((item) => (
                  <article
                    key={item.id}
                    className="h-full flex flex-col justify-between bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 rounded-3xl p-6 shadow-md dark:shadow-xl transition"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <RatingStars rating={item.rating} />
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 truncate max-w-[150px]">
                          {item.serviceTitle}
                        </span>
                      </div>

                      <div className="relative">
                        <Quote className="w-5 h-5 text-sky-500/30 dark:text-sky-400/25 mb-1.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4">
                          &ldquo;{item.comment}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ReviewerAvatar
                          src={item.customerImage}
                          name={item.customerName}
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.customerName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.isEdited
                              ? "Updated review"
                              : "Verified customer"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {maxSlideIndex > 0 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  {Array.from({ length: maxSlideIndex + 1 }).map((_, idx) => {
                    const active = idx === slideIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSlideIndex(idx)}
                        aria-label={`Go to review slide ${idx + 1}`}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          active
                            ? "w-7 bg-sky-500"
                            : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}