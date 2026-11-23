"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const HERO_SLIDES = [
  {
    id: "verified-repairs",
    badge: "On-Demand Device & Appliance Repair",
    titlePrefix: "Broken Device? Get It Fixed by",
    titleHighlight: "Verified Technicians",
    description:
      "Book trusted repair specialists for smartphones, laptops, ACs, fridges, TVs, and home appliances with upfront starting prices and pay-after-completion peace of mind.",
    placeholder: "Search AC repair, laptop screen, fridge...",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Technician repairing electronics with precision tools",
    statusTag: "Same-Day Slot Available",
    turnaround: "Fast & Reliable",
    serviceModes: "Home & Workshop",
    highlights: [
      "Verified specialists",
      "Transparent starting prices",
      "Pay after completion",
    ],
  },
  {
    id: "home-appliance-care",
    badge: "Doorstep Home Appliance Care",
    titlePrefix: "Fast Home Service for",
    titleHighlight: "AC, Fridge & TV",
    description:
      "Schedule convenient home visits or workshop drop-offs with real-time job updates, genuine replacement parts, and zero surprise charges.",
    placeholder: "Search split AC servicing, refrigerator gas, smart TV...",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Home appliance and electrical technician inspecting equipment",
    statusTag: "Doorstep Visit Ready",
    turnaround: "Under 24 Hours",
    serviceModes: "Doorstep & Studio",
    highlights: [
      "Upfront diagnostic clarity",
      "Live booking status updates",
      "Paid PDF invoice support",
    ],
  },
  {
    id: "laptop-mobile-pro",
    badge: "Precision Gadget & Laptop Lab",
    titlePrefix: "Reliable Fixes for",
    titleHighlight: "Laptops & Smartphones",
    description:
      "From cracked screens and battery replacements to motherboard diagnostics, get your daily devices restored by experienced pros.",
    placeholder: "Search laptop keyboard, battery, phone display...",
    image:
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "Circuit board and hardware diagnostic tools on workbench",
    statusTag: "Priority Lab Support",
    turnaround: "Express Diagnostics",
    serviceModes: "Workshop & Pickup",
    highlights: [
      "Skilled hardware technicians",
      "Clear pricing before repair",
      "Trusted customer reviews",
    ],
  },
];

const HERO_FALLBACK_IMAGE = HERO_SLIDES[0].image;

export default function HomeHeroSection({
  averageRating = null,
  reviewsCount = 0,
  heroImage = "",
  onNavigate,
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState({});

  const totalSlides = HERO_SLIDES.length;

  const goToSlide = useCallback(
    (index) => {
      setActiveIndex((index + totalSlides) % totalSlides);
    },
    [totalSlides],
  );

  const handlePrev = useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  const handleNext = useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, 2800);
    return () => clearInterval(timer);
  }, [totalSlides]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    onNavigate?.();
    if (trimmed) {
      router.push(`/services?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/services");
    }
  };

  const displayRating =
    averageRating && reviewsCount > 0 ? averageRating : "4.9";

  const activeSlide = HERO_SLIDES[activeIndex] || HERO_SLIDES[0];

  const resolveSlideImage = (slide, index) => {
    if (brokenImages[slide.id]) {
      return HERO_FALLBACK_IMAGE;
    }
    if (index === 0 && heroImage && String(heroImage).trim()) {
      return String(heroImage).trim();
    }
    return slide.image || HERO_FALLBACK_IMAGE;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured repair highlights"
      className="relative h-auto lg:h-[700px] min-h-[680px] sm:min-h-[640px] lg:min-h-[700px] flex items-center overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 transition-colors duration-300"
    >
      {/* Clearer background image layer with smooth crossfade */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex;
          const bgSrc = resolveSlideImage(slide, index);

          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              style={{
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className={`absolute inset-0 transition-all duration-500 ${
                isActive
                  ? "opacity-60 dark:opacity-50 scale-100"
                  : "opacity-0 scale-105"
              }`}
            >
              <img
                src={bgSrc}
                alt=""
                onError={() =>
                  setBrokenImages((prev) => ({ ...prev, [slide.id]: true }))
                }
                className="w-full h-full object-cover object-center"
              />
            </div>
          );
        })}

        <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/45 to-white/30 dark:from-slate-950/80 dark:via-slate-950/55 dark:to-slate-950/45" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[780px] h-[380px] rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 lg:py-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Content Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Fixed-height badge slot */}
            <div className="h-8 flex items-center">
              <div
                key={`badge-${activeSlide.id}`}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/85 border border-sky-500/35 text-sky-700 dark:text-sky-300 text-xs font-semibold backdrop-blur-xs shadow-2xs transition-all duration-500"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                <span>{activeSlide.badge}</span>
              </div>
            </div>

            {/* Fixed-height headline & description slot so height never shifts */}
            <div className="relative min-h-[235px] sm:min-h-[250px] lg:min-h-[275px]">
              {HERO_SLIDES.map((slide, index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={`copy-${slide.id}`}
                    aria-hidden={!isActive}
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    className={`space-y-3.5 transition-all duration-500 ${
                      isActive
                        ? "relative opacity-100 translate-y-0"
                        : "absolute inset-0 opacity-0 translate-y-2 pointer-events-none"
                    }`}
                  >
                    <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] xl:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.06]">
                      {slide.titlePrefix}{" "}
                      <span className="text-sky-600 dark:text-sky-400">
                        {slide.titleHighlight}
                      </span>
                    </h1>

                    <p className="text-slate-800 dark:text-slate-200 text-base sm:text-lg max-w-2xl leading-relaxed font-medium">
                      {slide.description}
                    </p>
                  </div>
                );
              })}
            </div>

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
                  placeholder={activeSlide.placeholder}
                  className="w-full rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
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
                onClick={() => onNavigate?.()}
                className="inline-flex items-center justify-center gap-2 bg-white/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-sm px-5 py-3 rounded-xl transition shrink-0"
              >
                <span>Explore Services</span>
              </Link>
            </form>

            {/* Fixed-height highlights slot */}
            <div className="relative min-h-[28px] flex items-center">
              {HERO_SLIDES.map((slide, index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={`highlights-${slide.id}`}
                    aria-hidden={!isActive}
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 transition-all duration-500 ${
                      isActive
                        ? "relative opacity-100 translate-y-0"
                        : "absolute inset-0 opacity-0 translate-y-1 pointer-events-none"
                    }`}
                  >
                    {slide.highlights.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        {item}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Slide Controls & Indicators */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous slide"
                  className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/95 hover:bg-sky-500 hover:text-slate-950 dark:hover:bg-sky-500 dark:hover:text-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition duration-300 cursor-pointer shadow-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next slide"
                  className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-900/95 hover:bg-sky-500 hover:text-slate-950 dark:hover:bg-sky-500 dark:hover:text-slate-950 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition duration-300 cursor-pointer shadow-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div
                role="tablist"
                aria-label="Hero slides"
                className="flex items-center gap-2"
              >
                {HERO_SLIDES.map((slide, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Slide ${idx + 1}: ${slide.titleHighlight}`}
                      onClick={() => goToSlide(idx)}
                      style={{
                        transitionTimingFunction:
                          "cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "w-8 bg-sky-500 shadow-xs shadow-sky-500/40"
                          : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-sky-400/70"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Preview Card Column */}
          <div className="lg:col-span-5">
            <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl dark:shadow-2xl space-y-4 backdrop-blur-xs">
              <div className="aspect-[4/3] h-[270px] sm:h-[310px] lg:h-[340px] w-full rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden relative flex items-center justify-center">
                {HERO_SLIDES.map((slide, index) => {
                  const isActive = index === activeIndex;
                  const cardImgSrc = resolveSlideImage(slide, index);

                  return (
                    <img
                      key={`card-${slide.id}`}
                      src={cardImgSrc}
                      alt={slide.imageAlt}
                      onError={() =>
                        setBrokenImages((prev) => ({
                          ...prev,
                          [slide.id]: true,
                        }))
                      }
                      style={{
                        transitionTimingFunction:
                          "cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                        isActive
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-105 pointer-events-none"
                      }`}
                    />
                  );
                })}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between gap-2 z-10">
                  <span
                    key={`status-${activeSlide.id}`}
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 backdrop-blur-xs transition-all duration-300"
                  >
                    {activeSlide.statusTag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 dark:text-amber-300 border border-amber-500/30 backdrop-blur-xs">
                    <span className="text-amber-500 dark:text-amber-400">
                      ★
                    </span>
                    <span>{displayRating} Rating</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Turnaround
                  </p>
                  <p
                    key={`turnaround-${activeSlide.id}`}
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    className="text-base font-bold text-slate-900 dark:text-white mt-1 transition-all duration-300"
                  >
                    {activeSlide.turnaround}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Service Modes
                  </p>
                  <p
                    key={`modes-${activeSlide.id}`}
                    style={{
                      transitionTimingFunction:
                        "cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1 transition-all duration-300"
                  >
                    {activeSlide.serviceModes}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}