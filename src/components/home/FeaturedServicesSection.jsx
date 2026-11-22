"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";

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

export default function FeaturedServicesSection({
  services = [],
  selectedCategory = "",
  selectedCategoryQueryValue = "",
  loading = false,
  error = "",
  onClearCategory,
  onRetry,
  onNavigate,
  resolveTechnicianName,
}) {
  return (
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
              onClick={() => onClearCategory?.()}
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
            onClick={() => onNavigate?.()}
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
            onClick={() => onRetry?.()}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-900 dark:text-white transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : services.length === 0 ? (
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
              onClick={() => onClearCategory?.()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition cursor-pointer"
            >
              Show All Featured
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const id = service._id || service.id;
            const modeLabel =
              service.mode || service.serviceMode || "Home Visit";
            const techName = resolveTechnicianName
              ? resolveTechnicianName(service)
              : service.technicianName ||
                service.technician?.name ||
                "Verified Technician";

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
                    onClick={() => onNavigate?.()}
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
  );
}