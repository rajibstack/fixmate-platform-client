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
  Loader2,
} from "lucide-react";

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

function matchesCategoryFilter(service, selectedCategory) {
  if (!selectedCategory) return true;
  const cat = (service?.category || "").toLowerCase();
  const title = (service?.title || "").toLowerCase();
  const target = selectedCategory.toLowerCase();

  if (target === "ac") {
    return cat.includes("ac") || title.includes("ac");
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
    return cat.includes("tv") || title.includes("tv");
  }
  if (target === "washing machine") {
    return (
      cat.includes("washing") ||
      cat.includes("home appliances") ||
      title.includes("washing")
    );
  }
  return cat.includes(target) || title.includes(target);
}

export default function HomePage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch (err) {
      setError(err.message || "Could not load featured services.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchFeaturedServices();
  }, [fetchFeaturedServices]);

  const featuredServices = useMemo(() => {
    const filtered = selectedCategory
      ? allServices.filter((item) => matchesCategoryFilter(item, selectedCategory))
      : allServices;
    return filtered.slice(0, 6);
  }, [allServices, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
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

  return (
    <div className="bg-slate-950 text-slate-100">
      {/* 1. Hero / Banner Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[340px] rounded-full bg-sky-500/10 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 lg:py-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>On-Demand Device & Appliance Repair</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Broken Device? Get It Fixed by{" "}
                <span className="text-sky-400">Verified Technicians</span>
              </h1>

              <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
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
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search AC repair, laptop screen, fridge..."
                    className="w-full rounded-xl bg-slate-900/95 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition"
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
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition shrink-0"
                >
                  <span>Explore Services</span>
                </Link>
              </form>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  Verified specialists
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  Transparent starting prices
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  Pay after completion
                </span>
              </div>
            </div>

            {/* Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                <div className="aspect-[16/10] w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1000&q=80"
                    alt="Technician repairing electronics with precision tools"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 backdrop-blur-xs">
                      Same-Day Slot Available
                    </span>
                    <span className="text-xs font-medium text-slate-200 bg-slate-900/85 px-3 py-1 rounded-full border border-slate-700/80">
                      4.9 ★ Rating
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
                    <p className="text-xs text-slate-400">Turnaround</p>
                    <p className="text-base font-bold text-white mt-1">
                      Fast & Reliable
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4">
                    <p className="text-xs text-slate-400">Service Modes</p>
                    <p className="text-base font-bold text-sky-400 mt-1">
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Featured Listings
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              {selectedCategory
                ? `${selectedCategory} Services`
                : "Latest Approved Services"}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Available services vetted for quality and ready to book.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory("")}
                className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition cursor-pointer"
              >
                Clear filter
              </button>
            )}
            <Link
              href={
                selectedCategory
                  ? `/services?category=${encodeURIComponent(selectedCategory)}`
                  : "/services"
              }
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 transition"
            >
              <span>View All Services</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900/60 border border-slate-800 rounded-3xl">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-sm">Loading featured services...</span>
          </div>
        ) : error ? (
          <div className="py-12 px-6 text-center bg-slate-900/90 border border-rose-500/30 rounded-3xl space-y-3">
            <p className="text-sm font-medium text-rose-300">{error}</p>
            <button
              type="button"
              onClick={fetchFeaturedServices}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : featuredServices.length === 0 ? (
          <div className="py-14 px-6 text-center bg-slate-900/90 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              No matching services found
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
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
              const modeLabel = service.mode || service.serviceMode || "Home Visit";
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
                    <div className="h-44 w-full bg-slate-950 border-b border-slate-800/80 overflow-hidden flex items-center justify-center">
                      {service.image ? (
                        <img
                          src={service.image}
                          alt={service.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Wrench className="w-9 h-9 text-sky-400/70" />
                      )}
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/25 font-semibold truncate">
                          {service.category || "General Repair"}
                        </span>
                        <span className="text-slate-400 font-medium truncate">
                          {modeLabel}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white line-clamp-1">
                        {service.title}
                      </h3>

                      <p className="text-xs text-slate-400 truncate">
                        Technician:{" "}
                        <span className="text-slate-200 font-medium">
                          {techName}
                        </span>
                      </p>
                    </div>
                  </div>

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
      <section className="border-y border-slate-800/80 bg-slate-900/40 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Simple Process
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              How FixMate Works
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              Four straightforward steps from booking to a working device.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS_STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="h-full flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-lg relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold tracking-widest text-slate-500">
                        STEP {item.step}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {idx < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="mt-5 pt-3 border-t border-slate-800/70 flex items-center gap-1.5 text-xs font-medium text-sky-400/90">
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
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Categories
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
                Popular Repair Categories
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Click a category to filter featured services below.
              </p>
            </div>

            <Link
              href="/services"
              className="text-sm font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1.5 self-start sm:self-auto"
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
                      ? "bg-sky-500/15 border-sky-500 text-white shadow-lg shadow-sky-500/10"
                      : "bg-slate-900/90 border-slate-800 hover:border-sky-500/40 text-slate-100"
                  }`}
                >
                  <div className="space-y-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isSelected
                          ? "bg-sky-500 text-slate-950 border-sky-400"
                          : "bg-slate-950 text-sky-400 border-slate-800"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {cat.tagline}
                      </p>
                    </div>
                  </div>

                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-400">
                    <span>{isSelected ? "Selected" : "Filter services"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us / Platform Trust Stats */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Why Choose FixMate
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Built on Trust, Speed & Accountability
              </h2>
            </div>
            <Link
              href="/services"
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
                  className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 space-y-2.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm font-semibold text-sky-400">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}