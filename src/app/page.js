"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";
import HomeHeroSection from "@/components/home/HomeHeroSection";
import FeaturedServicesSection from "@/components/home/FeaturedServicesSection";
import HowFixMateWorksHomeSection from "@/components/home/HowFixMateWorksHomeSection";
import PopularCategoriesTrustSection, {
  POPULAR_CATEGORIES,
} from "@/components/home/PopularCategoriesTrustSection";
import CustomerReviewsSection from "@/components/home/CustomerReviewsSection";


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
    cat.includes(queryVal) || cat.includes(target) || title.includes(target)
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

export default function HomePage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [allServices, setAllServices] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

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

        const fallbackRes = await fetch(
          `${apiUrl}/api/services?_t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );
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

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce(
      (acc, item) => acc + (Number(item.rating) || 5),
      0
    );
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory((prev) => (prev === categoryName ? "" : categoryName));
    const section = document.getElementById("featured-services");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (navigating) {
    return <PublicPageSkeleton cards={6} />;
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <HomeHeroSection
        averageRating={averageRating}
        reviewsCount={reviews.length}
        onNavigate={() => setNavigating(true)}
      />

      <FeaturedServicesSection
        services={featuredServices}
        selectedCategory={selectedCategory}
        selectedCategoryQueryValue={selectedCategoryQueryValue}
        loading={loading}
        error={error}
        onClearCategory={() => setSelectedCategory("")}
        onRetry={fetchFeaturedServices}
        onNavigate={() => setNavigating(true)}
        resolveTechnicianName={(srv) => resolveTechnicianName(srv, currentUser)}
      />

      <HowFixMateWorksHomeSection />

      <PopularCategoriesTrustSection
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryClick}
        onNavigate={() => setNavigating(true)}
      />

      <CustomerReviewsSection
        reviews={reviews}
        averageRating={averageRating}
        loading={reviewsLoading}
        error={reviewsError}
        onRefresh={fetchDynamicReviews}
      />
    </div>
  );
}