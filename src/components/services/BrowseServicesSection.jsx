"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Wrench,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  UserCheck,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";

const CATEGORY_OPTIONS = [
  "All",
  "Smartphone",
  "Laptop & PC",
  "AC & Refrigeration",
  "TV & Electronics",
  "Home Appliances",
  "Electrical",
];

const MODE_OPTIONS = [
  "All",
  "Home Visit",
  "Workshop Drop-off",
  "Pickup & Delivery",
];

const FALLBACK_SERVICE_IMAGE =
  "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80";

function isServiceApprovedAndAvailable(service) {
  if (!service || typeof service !== "object") return false;
  const status = (
    service?.status ||
    service?.approvalStatus ||
    "approved"
  )
    .toString()
    .toLowerCase()
    .trim();
  const isApproved = ["approved", "active", "published", ""].includes(status);
  const isAvailable =
    service?.available !== false && service?.isAvailable !== false;
  return isApproved && isAvailable;
}

function normalizeCategoryOption(rawCategory = "All") {
  const trimmed = (rawCategory || "All").toString().trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return "All";
  if (trimmed.toLowerCase() === "ac") return "AC & Refrigeration";
  const matched = CATEGORY_OPTIONS.find(
    (opt) => opt.toLowerCase() === trimmed.toLowerCase()
  );
  return matched || trimmed;
}

function normalizeModeOption(rawMode = "All") {
  const trimmed = (rawMode || "All").toString().trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return "All";
  const matched = MODE_OPTIONS.find(
    (opt) => opt.toLowerCase() === trimmed.toLowerCase()
  );
  return matched || trimmed;
}

function normalizeSortOption(rawSort = "newest") {
  const trimmed = (rawSort || "newest").toString().trim().toLowerCase();
  if (["newest", "price-asc", "price-desc"].includes(trimmed)) {
    return trimmed;
  }
  return "newest";
}

function normalizePageOption(rawPage = "1") {
  const parsed = Number.parseInt(String(rawPage || "1"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
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
    service?.technician?.name ||
    service?.technicianName ||
    "Verified Technician"
  );
}

function ServiceCardImage({ src, alt }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_SERVICE_IMAGE);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setImgSrc(src || FALLBACK_SERVICE_IMAGE);
    setFailed(false);
  }, [src]);

  if (failed && !imgSrc) {
    return <Wrench className="w-8 h-8 text-sky-500 dark:text-sky-400/70" />;
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (imgSrc !== FALLBACK_SERVICE_IMAGE) {
          setImgSrc(FALLBACK_SERVICE_IMAGE);
        } else {
          setFailed(true);
        }
      }}
      className="w-full h-full object-cover"
    />
  );
}

export default function BrowseServicesSection({
  itemsPerPage = 8,
  syncWithUrl = true,
  basePath = "/services",
  showHeader = true,
  className = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const urlQuery = syncWithUrl
    ? searchParams.get("search") || searchParams.get("q") || ""
    : "";
  const urlCategory = syncWithUrl
    ? normalizeCategoryOption(searchParams.get("category") || "All")
    : "All";
  const urlMode = syncWithUrl
    ? normalizeModeOption(searchParams.get("mode") || "All")
    : "All";
  const urlSort = syncWithUrl
    ? normalizeSortOption(searchParams.get("sort") || "newest")
    : "newest";
  const urlPage = syncWithUrl
    ? normalizePageOption(searchParams.get("page") || "1")
    : 1;

  const [services, setServices] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(urlPage);

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedMode, setSelectedMode] = useState(urlMode);
  const [sortBy, setSortBy] = useState(urlSort);

  const debounceTimerRef = useRef(null);
  const searchInputRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (!syncWithUrl) return;
    setSearchTerm((prev) => (prev === urlQuery ? prev : urlQuery));
    setSelectedCategory(urlCategory);
    setSelectedMode(urlMode);
    setSortBy(urlSort);
    setCurrentPage(urlPage);
  }, [syncWithUrl, urlQuery, urlCategory, urlMode, urlSort, urlPage]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const syncUrlParams = useCallback(
    ({ search, category, mode, sort, page = 1 }) => {
      if (!syncWithUrl) return;

      const params = new URLSearchParams();
      const trimmedSearch = (search || "").trim();
      const safePage = normalizePageOption(page);

      if (trimmedSearch) params.set("search", trimmedSearch);
      if (category && category !== "All") params.set("category", category);
      if (mode && mode !== "All") params.set("mode", mode);
      if (sort && sort !== "newest") params.set("sort", sort);
      if (safePage > 1) params.set("page", String(safePage));

      const queryString = params.toString();
      const targetUrl = queryString ? `${basePath}?${queryString}` : basePath;
      const currentFullUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "";

      if (targetUrl !== currentFullUrl) {
        router.replace(targetUrl, { scroll: false });
      }
    },
    [syncWithUrl, basePath, router]
  );

  const fetchServicesFromServer = useCallback(
    async ({
      search,
      category,
      mode,
      sort,
      page = 1,
      limit = itemsPerPage,
      isInitial = false,
    }) => {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setFetching(true);
      }
      setError("");

      try {
        const params = new URLSearchParams();
        const trimmedSearch = (search || "").trim();
        const safePage = normalizePageOption(page);

        if (trimmedSearch) params.set("search", trimmedSearch);
        if (category && category !== "All") {
          params.set("category", category);
        }
        if (mode && mode !== "All") {
          params.set("mode", mode);
        }
        if (sort) {
          params.set("sort", sort);
        }
        params.set("page", String(safePage));
        params.set("limit", String(limit));

        const endpoint = `${apiUrl}/api/services?${params.toString()}`;

        const res = await fetch(endpoint, {
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

        const approvedValid = rawList.filter(isServiceApprovedAndAvailable);
        const serverTotalCount = Number.isFinite(Number(data?.totalCount))
          ? Number(data.totalCount)
          : approvedValid.length;
        const serverTotalPages = Number.isFinite(Number(data?.totalPages))
          ? Math.max(1, Number(data.totalPages))
          : Math.max(1, Math.ceil(serverTotalCount / limit));
        const serverPage = Number.isFinite(Number(data?.page))
          ? Math.min(Math.max(1, Number(data.page)), serverTotalPages)
          : Math.min(safePage, serverTotalPages);

        setServices(approvedValid);
        setTotalCount(serverTotalCount);
        setTotalPages(serverTotalPages);
        setCurrentPage(serverPage);
      } catch (err) {
        setError(err.message || "Could not fetch services.");
      } finally {
        hasLoadedOnceRef.current = true;
        setInitialLoading(false);
        setFetching(false);
      }
    },
    [apiUrl, itemsPerPage]
  );

  useEffect(() => {
    fetchServicesFromServer({
      search: syncWithUrl ? urlQuery : searchTerm,
      category: syncWithUrl ? urlCategory : selectedCategory,
      mode: syncWithUrl ? urlMode : selectedMode,
      sort: syncWithUrl ? urlSort : sortBy,
      page: syncWithUrl ? urlPage : currentPage,
      limit: itemsPerPage,
      isInitial: !hasLoadedOnceRef.current,
    });
  }, [
    fetchServicesFromServer,
    syncWithUrl,
    urlQuery,
    urlCategory,
    urlMode,
    urlSort,
    urlPage,
    searchTerm,
    selectedCategory,
    selectedMode,
    sortBy,
    currentPage,
    itemsPerPage,
  ]);

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

  const applyFilterUpdate = ({
    search = searchTerm,
    category = selectedCategory,
    mode = selectedMode,
    sort = sortBy,
    page = 1,
  }) => {
    setCurrentPage(page);
    if (syncWithUrl) {
      syncUrlParams({ search, category, mode, sort, page });
    } else {
      fetchServicesFromServer({
        search,
        category,
        mode,
        sort,
        page,
        limit: itemsPerPage,
      });
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      applyFilterUpdate({
        search: value,
        category: selectedCategory,
        mode: selectedMode,
        sort: sortBy,
        page: 1,
      });
    }, 250);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    applyFilterUpdate({
      search: searchTerm,
      category: selectedCategory,
      mode: selectedMode,
      sort: sortBy,
      page: 1,
    });
  };

  const handleCategoryChange = (category) => {
    const normalized = normalizeCategoryOption(category);
    setSelectedCategory(normalized);
    applyFilterUpdate({
      search: searchTerm,
      category: normalized,
      mode: selectedMode,
      sort: sortBy,
      page: 1,
    });
  };

  const handleModeChange = (mode) => {
    const normalized = normalizeModeOption(mode);
    setSelectedMode(normalized);
    applyFilterUpdate({
      search: searchTerm,
      category: selectedCategory,
      mode: normalized,
      sort: sortBy,
      page: 1,
    });
  };

  const handleSortChange = (sortValue) => {
    const normalized = normalizeSortOption(sortValue);
    setSortBy(normalized);
    applyFilterUpdate({
      search: searchTerm,
      category: selectedCategory,
      mode: selectedMode,
      sort: normalized,
      page: 1,
    });
  };

  const handlePageChange = (pageNumber) => {
    const safePage = Math.min(Math.max(1, pageNumber), totalPages);
    setCurrentPage(safePage);
    if (syncWithUrl) {
      syncUrlParams({
        search: searchTerm,
        category: selectedCategory,
        mode: selectedMode,
        sort: sortBy,
        page: safePage,
      });
    } else {
      fetchServicesFromServer({
        search: searchTerm,
        category: selectedCategory,
        mode: selectedMode,
        sort: sortBy,
        page: safePage,
        limit: itemsPerPage,
      });
    }
  };

  const handleResetFilters = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedMode("All");
    setSortBy("newest");
    setCurrentPage(1);
    if (syncWithUrl) {
      router.replace(basePath, { scroll: false });
    } else {
      fetchServicesFromServer({
        search: "",
        category: "All",
        mode: "All",
        sort: "newest",
        page: 1,
        limit: itemsPerPage,
      });
    }
    searchInputRef.current?.focus();
  };

  const hasActiveFilter =
    Boolean(searchTerm.trim()) ||
    (selectedCategory && selectedCategory !== "All") ||
    (selectedMode && selectedMode !== "All") ||
    sortBy !== "newest";

  if (initialLoading) {
    return <PublicPageSkeleton cards={itemsPerPage} />;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const startItem = totalCount === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + services.length, totalCount);

  return (
    <section
      aria-label="Browse Services"
      className={`bg-slate-50/90 dark:bg-slate-950/60 py-12 sm:py-16 transition-colors duration-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {showHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Service Directory
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Browse Services
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
                Explore verified repair services available for home visit or shop
                drop-off with clear starting prices.
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 shrink-0">
              {fetching && (
                <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </span>
              )}
              <span>
                Showing{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {totalCount === 0 ? 0 : `${startItem}-${endItem}`}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {totalCount}
                </span>{" "}
                {totalCount === 1 ? "service" : "services"}
              </span>
            </div>
          </div>
        )}

        {/* Search, Category, Service Mode & Sort Toolbar */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-md dark:shadow-xl space-y-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 md:grid-cols-12 gap-3.5"
          >
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by service title or category..."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
              />
            </div>

            <div className="md:col-span-3 relative">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="bg-white dark:bg-slate-900"
                  >
                    {category === "All" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 relative">
              <Laptop className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Filter by service mode"
                value={selectedMode}
                onChange={(e) => handleModeChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition cursor-pointer"
              >
                {MODE_OPTIONS.map((modeOption) => (
                  <option
                    key={modeOption}
                    value={modeOption}
                    className="bg-white dark:bg-slate-900"
                  >
                    {modeOption === "All" ? "All Service Modes" : modeOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="Sort services"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition cursor-pointer"
              >
                <option value="newest" className="bg-white dark:bg-slate-900">
                  Newest
                </option>
                <option
                  value="price-asc"
                  className="bg-white dark:bg-slate-900"
                >
                  Price: Low to High
                </option>
                <option
                  value="price-desc"
                  className="bg-white dark:bg-slate-900"
                >
                  Price: High to Low
                </option>
              </select>
            </div>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORY_OPTIONS.map((category) => {
              const active =
                selectedCategory.toLowerCase() === category.toLowerCase();
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    active
                      ? "bg-sky-500 text-slate-950 border-sky-400 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                  }`}
                >
                  {category}
                </button>
              );
            })}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 bg-rose-500/10 border border-rose-500/25 whitespace-nowrap transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Services Grid / States */}
        {error ? (
          <div className="py-14 px-6 text-center bg-white dark:bg-slate-900/90 border border-rose-500/30 rounded-3xl space-y-3">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <button
              type="button"
              onClick={() =>
                fetchServicesFromServer({
                  search: searchTerm,
                  category: selectedCategory,
                  mode: selectedMode,
                  sort: sortBy,
                  page: currentPage,
                  limit: itemsPerPage,
                })
              }
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="py-16 px-6 text-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              No services found
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              No approved and available services matched your current search or
              filter selection. Try clearing your filters to view all services.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service, index) => {
                const rawId = service?._id || service?.id || service?.slug;
                const id = rawId ? String(rawId).trim() : "";
                const modeLabel =
                  service?.mode || service?.serviceMode || "Home Visit";
                const areaLabel =
                  service?.area ||
                  service?.serviceArea ||
                  "Service Area Available";
                const techName = resolveTechnicianName(service, currentUser);

                return (
                  <article
                    key={id || `service-${index}`}
                    className="h-full flex flex-col justify-between bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 rounded-3xl overflow-hidden shadow-md dark:shadow-xl transition"
                  >
                    <div>
                      <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 overflow-hidden flex items-center justify-center">
                        <ServiceCardImage
                          src={service?.image}
                          alt={service?.title || "Repair Service"}
                        />
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 font-semibold truncate">
                            {service?.category || "General Repair"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium truncate shrink-0">
                            <Laptop className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span>{modeLabel}</span>
                          </span>
                        </div>

                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                          {service?.title}
                        </h2>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                          <p className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span className="truncate">{areaLabel}</span>
                          </p>
                          <p className="flex items-center gap-1.5 truncate">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate text-slate-700 dark:text-slate-300">
                              {techName}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-slate-200 dark:border-slate-800/70 flex items-center justify-between gap-3">
                      <div>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          Starting at
                        </span>
                        <span className="text-lg font-bold text-sky-600 dark:text-sky-400">
                          ${Number(service?.price || 0)}
                        </span>
                      </div>

                      {id ? (
                        <Link
                          href={`/services/${encodeURIComponent(id)}`}
                          className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition shadow-md shadow-sky-500/15 shrink-0"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-1.5 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold text-xs px-3.5 py-2.5 rounded-xl cursor-not-allowed shrink-0"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800/80">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Page{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1 || fetching}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500/40 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNum = index + 1;
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          disabled={fetching}
                          onClick={() => handlePageChange(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          aria-current={isActive ? "page" : undefined}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            isActive
                              ? "bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages || fetching}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-sky-500/40 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}