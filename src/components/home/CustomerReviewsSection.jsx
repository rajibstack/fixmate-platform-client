"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
  RefreshCw,
} from "lucide-react";

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

export default function CustomerReviewsSection({
  reviews = [],
  averageRating = null,
  loading = false,
  error = "",
  onRefresh,
  className = "",
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

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

  const handlePrevSlide = () => {
    if (maxSlideIndex <= 0) return;
    setSlideIndex((prev) => (prev <= 0 ? maxSlideIndex : prev - 1));
  };

  const handleNextSlide = () => {
    if (maxSlideIndex <= 0) return;
    setSlideIndex((prev) => (prev >= maxSlideIndex ? 0 : prev + 1));
  };

  return (
    <section
      id="customer-reviews"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className={`border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/40 py-14 sm:py-16 ${className}`}
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
              Live reviews from real repair bookings — automatically synced when
              updated.
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
              onClick={() => onRefresh?.({ silent: false })}
              aria-label="Refresh reviews"
              title="Refresh reviews"
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loading ? "animate-spin text-sky-500" : ""
                }`}
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

        {loading && reviews.length === 0 ? (
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
        ) : error && reviews.length === 0 ? (
          <div className="py-12 px-6 text-center bg-white dark:bg-slate-900/90 border border-rose-500/30 rounded-3xl space-y-3">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
            <button
              type="button"
              onClick={() => onRefresh?.({ silent: false })}
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
  );
}