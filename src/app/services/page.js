"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Wrench,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  UserCheck,
  Laptop,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  "All",
  "Smartphone",
  "Laptop & PC",
  "AC & Refrigeration",
  "TV & Electronics",
  "Home Appliances",
  "Electrical",
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

function matchesSelectedCategory(serviceCategory = "", selectedCategory = "All") {
  if (!selectedCategory || selectedCategory === "All") return true;
  const cat = serviceCategory.toLowerCase().trim();
  const target = selectedCategory.toLowerCase().trim();

  if (cat === target) return true;
  if (target === "ac & refrigeration") {
    return (
      cat.includes("ac") ||
      cat.includes("refrigerator") ||
      cat.includes("fridge") ||
      cat.includes("cooling")
    );
  }
  if (target === "tv & electronics") {
    return cat.includes("tv") || cat.includes("electronic");
  }
  if (target === "home appliances") {
    return (
      cat.includes("appliance") ||
      cat.includes("washing") ||
      cat.includes("microwave")
    );
  }
  if (target === "laptop & pc") {
    return (
      cat.includes("laptop") ||
      cat.includes("pc") ||
      cat.includes("computer") ||
      cat.includes("desktop")
    );
  }
  return cat.includes(target);
}

function BrowseServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const initialQuery = searchParams.get("search") || searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(
    CATEGORY_OPTIONS.some(
      (opt) => opt.toLowerCase() === initialCategory.toLowerCase()
    )
      ? CATEGORY_OPTIONS.find(
          (opt) => opt.toLowerCase() === initialCategory.toLowerCase()
        )
      : initialCategory || "All"
  );
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q") || "";
    const cat = searchParams.get("category") || "All";
    setSearchTerm(q);
    if (cat) {
      const matchedOpt = CATEGORY_OPTIONS.find(
        (opt) => opt.toLowerCase() === cat.toLowerCase()
      );
      setSelectedCategory(matchedOpt || cat);
    }
  }, [searchParams]);

  const fetchServices = useCallback(async () => {
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

      const filteredValid = rawList.filter(isServiceApprovedAndAvailable);
      setServices(filteredValid);
    } catch (err) {
      setError(err.message || "Could not fetch services.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const visibleServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const matched = services.filter((service) => {
      const categoryOk = matchesSelectedCategory(
        service?.category || "",
        selectedCategory
      );
      if (!categoryOk) return false;

      if (!q) return true;

      const title = (service?.title || "").toLowerCase();
      const category = (service?.category || "").toLowerCase();
      const area = (service?.area || "").toLowerCase();
      const mode = (service?.mode || service?.serviceMode || "").toLowerCase();
      const tech = (
        service?.technicianName ||
        service?.technician?.name ||
        ""
      ).toLowerCase();
      const desc = (service?.description || "").toLowerCase();

      return (
        title.includes(q) ||
        category.includes(q) ||
        area.includes(q) ||
        mode.includes(q) ||
        tech.includes(q) ||
        desc.includes(q)
      );
    });

    const sorted = [...matched];
    if (sortBy === "price-asc") {
      sorted.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    } else if (sortBy === "price-desc") {
      sorted.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() -
          new Date(a?.createdAt || 0).getTime()
      );
    }

    return sorted;
  }, [services, searchTerm, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSortBy("newest");
    router.replace("/services");
  };

  const hasActiveFilter =
    Boolean(searchTerm.trim()) ||
    (selectedCategory && selectedCategory !== "All") ||
    sortBy !== "newest";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/90 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Service Directory
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
              Browse Services
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1.5 max-w-2xl">
              Explore verified repair services available for home visit or shop
              drop-off with clear starting prices.
            </p>
          </div>

          <div className="text-xs sm:text-sm text-slate-400 shrink-0">
            Showing{" "}
            <span className="font-bold text-white">{visibleServices.length}</span>{" "}
            {visibleServices.length === 1 ? "service" : "services"}
          </div>
        </div>

        {/* Search, Category Filter & Sort Toolbar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Search Box */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by device, service title, area, or technician..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
              />
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3 relative">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 pl-10 pr-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category} className="bg-slate-900">
                    {category === "All" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-3">
              <select
                aria-label="Sort services"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 px-4 py-2.5 text-sm text-white outline-none transition cursor-pointer"
              >
                <option value="newest" className="bg-slate-900">
                  Sort: Newest First
                </option>
                <option value="price-asc" className="bg-slate-900">
                  Price: Low to High
                </option>
                <option value="price-desc" className="bg-slate-900">
                  Price: High to Low
                </option>
              </select>
            </div>
          </div>

          {/* Quick Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORY_OPTIONS.map((category) => {
              const active =
                selectedCategory.toLowerCase() === category.toLowerCase();
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                    active
                      ? "bg-sky-500 text-slate-950 border-sky-400 shadow-sm"
                      : "bg-slate-950/80 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
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
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-500/10 border border-rose-500/25 whitespace-nowrap transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Services Grid / States */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/60 border border-slate-800 rounded-3xl">
            <Loader2 className="w-7 h-7 animate-spin text-sky-400" />
            <span className="text-sm">Loading available services...</span>
          </div>
        ) : error ? (
          <div className="py-14 px-6 text-center bg-slate-900/90 border border-rose-500/30 rounded-3xl space-y-3">
            <p className="text-sm font-medium text-rose-300">{error}</p>
            <button
              type="button"
              onClick={fetchServices}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : visibleServices.length === 0 ? (
          <div className="py-16 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">No services found</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleServices.map((service) => {
              const id = service._id || service.id;
              const modeLabel =
                service.mode || service.serviceMode || "Home Visit";
              const areaLabel =
                service.area || service.serviceArea || "Service Area Available";
              const techName =
                service.technicianName ||
                service.technician?.name ||
                "Verified Technician";

              return (
                <article
                  key={id}
                  className="h-full flex flex-col justify-between bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 rounded-3xl overflow-hidden shadow-xl transition"
                >
                  <div>
                    {/* Service Image */}
                    <div className="h-44 w-full bg-slate-950 border-b border-slate-800/80 overflow-hidden flex items-center justify-center">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Wrench className="w-8 h-8 text-sky-400/70" />
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/25 font-semibold truncate">
                          {service.category || "General Repair"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-300 font-medium truncate shrink-0">
                          <Laptop className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{modeLabel}</span>
                        </span>
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                        {service.title}
                      </h2>

                      <div className="space-y-1.5 text-xs text-slate-400 pt-0.5">
                        <p className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">{areaLabel}</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-300">
                            {techName}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price & View Details */}
                  <div className="px-5 pb-5 pt-3 border-t border-slate-800/70 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[11px] text-slate-400">
                        Starting at
                      </span>
                      <span className="text-lg font-bold text-sky-400">
                        ${Number(service.price || 0)}
                      </span>
                    </div>

                    <Link
                      href={`/services/${id}`}
                      className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition shadow-md shadow-sky-500/15 shrink-0"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading services...
        </div>
      }
    >
      <BrowseServicesContent />
    </Suspense>
  );
}