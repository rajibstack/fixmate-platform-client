"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Crown,
  Sparkles,
  User,
  AlertCircle,
  X,
} from "lucide-react";

const DEFAULT_ROLE_CARDS = [
  {
    key: "customer",
    badge: "For Customers",
    title: "Customer",
    subtitle:
      "Hassle-free device & home appliance repairs with pay-after-service trust.",
    priceTag: "Free to Join",
    icon: User,
    variant: "customer",
    highlighted: false,
    benefits: [
      "Browse verified technicians & transparent starting prices",
      "Book home visits or shop drop-offs with real-time status tracking",
      "Pay only after repair completion & download paid PDF invoices",
      "Rate technicians and manage or update your reviews anytime",
    ],
    guestCtaLabel: "Sign Up as Customer",
    guestHref: "/sign-up?role=customer",
    loggedInCtaLabel: "Go to My Bookings",
    loggedInHref: "/dashboard/customer/bookings",
  },
  {
    key: "free-technician",
    badge: "Starter Plan",
    title: "Free Technician",
    subtitle: "Ideal for independent technicians getting started on FixMate.",
    priceTag: "$0 / month",
    icon: Sparkles,
    variant: "free-pro",
    highlighted: true,
    benefits: [
      "List up to 3 repair services in your specialist categories",
      "Receive customer repair requests & update live job progress",
      "Manage service availability, pricing, and working areas",
      "Build customer trust with completed jobs and ratings",
    ],
    guestCtaLabel: "Sign Up as Technician",
    guestHref: "/sign-up?role=technician&plan=free",
    loggedInCtaLabel: "Add Service",
    loggedInHref: "/dashboard/technician/services",
  },
  {
    key: "pro-technician",
    badge: "Most Popular",
    title: "Pro Technician",
    subtitle:
      "Built for growing repair pros who want unlimited listings & priority trust.",
    priceTag: "$19 / month",
    icon: Crown,
    variant: "golden-pro",
    highlighted: true,
    benefits: [
      "Unlimited service listings across all supported repair categories",
      "Verified Pro badge to stand out in search & service cards",
      "Full access to service & job workflow management tools",
      "Scale bookings and repeat customer orders without listing limits",
    ],
    guestCtaLabel: "Get Started with Pro",
    guestHref: "/sign-up?role=technician&plan=pro",
    loggedInCtaLabel: "Add Service",
    loggedInHref: "/dashboard/technician/services",
  },
];

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

export default function ChooseHowYouUseSection({
  cards = DEFAULT_ROLE_CARDS,
  customerDashboardHref = "/dashboard/customer/bookings",
  technicianDashboardHref = "/dashboard/technician/services",
  adminBookingsHref = "/dashboard/admin/bookings",
  adminServicesHref = "/dashboard/admin/services",
  showTopBorder = true,
  className = "",
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [rolePopup, setRolePopup] = useState(null);

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

  const userRole = String(currentUser?.role || "")
    .toLowerCase()
    .trim();

  const isLoggedIn = Boolean(
    currentUser &&
      (currentUser.email ||
        currentUser.name ||
        currentUser._id ||
        currentUser.id)
  );

  const closeRolePopup = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRolePopup(null);
  }, []);

  const getCardActionDisplay = useCallback(
    (card) => {
      if (!isLoggedIn) {
        return {
          href: card.guestHref,
          label: card.guestCtaLabel,
        };
      }

      if (userRole === "admin") {
        if (card.key === "customer") {
          return {
            href: adminBookingsHref,
            label: "View All Bookings",
          };
        }
        return {
          href: adminServicesHref,
          label: "Manage Services",
        };
      }

      if (card.key === "customer") {
        if (userRole === "customer") {
          return {
            href: customerDashboardHref,
            label: card.loggedInCtaLabel || "Go to My Bookings",
          };
        }
        return {
          href: card.guestHref,
          label: card.guestCtaLabel,
        };
      }

      if (userRole === "technician") {
        return {
          href: technicianDashboardHref,
          label: card.loggedInCtaLabel || "Add Service",
        };
      }

      return {
        href: card.guestHref,
        label: card.guestCtaLabel,
      };
    },
    [
      isLoggedIn,
      userRole,
      customerDashboardHref,
      technicianDashboardHref,
      adminBookingsHref,
      adminServicesHref,
    ]
  );

  const handleRoleCardActionClick = useCallback(
    (e, card) => {
      if (!isLoggedIn) {
        return;
      }

      if (userRole === "admin") {
        e.preventDefault();
        const adminTarget =
          card.key === "customer" ? adminBookingsHref : adminServicesHref;
        router.push(adminTarget);
        return;
      }

      if (userRole === "customer") {
        if (card.key === "customer") {
          e.preventDefault();
          router.push(customerDashboardHref);
          return;
        }
        e.preventDefault();
        setRolePopup({
          title: "Technician Account Required",
          message:
            "You're not a technician go to sign up page and make a account as a technician with valid information.",
          signupHref: card.guestHref,
          signupLabel: "Go to Sign Up Page",
        });
        return;
      }

      if (userRole === "technician") {
        if (card.key === "customer") {
          e.preventDefault();
          setRolePopup({
            title: "Customer Account Required",
            message:
              "You're not a customer go to sign up page and make a account as a customer with valid information.",
            signupHref: card.guestHref,
            signupLabel: "Go to Sign Up Page",
          });
          return;
        }
        e.preventDefault();
        router.push(technicianDashboardHref);
      }
    },
    [
      isLoggedIn,
      userRole,
      router,
      customerDashboardHref,
      technicianDashboardHref,
      adminBookingsHref,
      adminServicesHref,
    ]
  );

  return (
    <>
      <section
        aria-labelledby="roles-benefits-heading"
        className={`bg-white dark:bg-slate-900/45 py-12 sm:py-16 transition-colors duration-200 ${
          showTopBorder
            ? "border-t border-slate-200 dark:border-slate-800/80"
            : ""
        } ${className}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Accounts &amp; Plans
              </p>
              <h2
                id="roles-benefits-heading"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1"
              >
                Choose How You Use FixMate
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl">
                Whether you need reliable repairs as a customer or want to offer
                services as a technician, pick the option that fits your workflow.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon || User;
              const action = getCardActionDisplay(card);

              const isGolden =
                card.variant === "golden-pro" || card.key === "pro-technician";
              const isProStyle =
                isGolden ||
                card.variant === "free-pro" ||
                card.key === "free-technician" ||
                Boolean(card.highlighted);

              const cardSurfaceClass = isGolden
                ? "bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-400/80 ring-1 ring-amber-400/35 hover:border-amber-500"
                : isProStyle
                ? "bg-white dark:bg-slate-900 border-sky-500/60 ring-1 ring-sky-500/25 hover:border-sky-500"
                : "bg-slate-50/80 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-sky-500/40";

              const badgeClass = isGolden
                ? "bg-amber-50 dark:bg-amber-950/80 text-amber-500 dark:text-amber-400 border border-amber-400"
                : isProStyle
                ? "bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 border border-sky-400/60"
                : "bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800";

              const badgeIconClass = isGolden
                ? "text-amber-500 dark:text-amber-400"
                : "text-sky-600 dark:text-sky-400";

              const priceClass = isGolden
                ? "text-amber-500 dark:text-amber-400"
                : "text-sky-600 dark:text-sky-400";

              const checkBadgeClass = isGolden
                ? "bg-amber-50 dark:bg-amber-950/80 border-amber-400 text-amber-500 dark:text-amber-400"
                : "bg-sky-50 dark:bg-sky-950/80 border-sky-400/70 text-sky-600 dark:text-sky-400";

              const buttonClass = isGolden
                ? "bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold shadow-md shadow-amber-500/25"
                : isProStyle
                ? "bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-500/20"
                : "bg-white dark:bg-slate-800 hover:bg-sky-500 text-slate-900 dark:text-white hover:text-slate-950 font-semibold border border-slate-300 dark:border-slate-700 hover:border-sky-400";

              return (
                <article
                  key={card.key}
                  className={`h-full flex flex-col justify-between rounded-3xl p-6 transition shadow-md dark:shadow-xl border ${cardSurfaceClass}`}
                >
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${badgeIconClass}`} />
                        <span>{card.badge}</span>
                      </span>

                      <span
                        className={`text-base sm:text-lg font-bold tracking-tight ${priceClass}`}
                      >
                        {card.priceTag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {card.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {card.subtitle}
                      </p>
                    </div>

                    <ul className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      {card.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
                        >
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${checkBadgeClass}`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                          <span className="leading-relaxed">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800/80">
                    <Link
                      href={action.href}
                      onClick={(e) => handleRoleCardActionClick(e, card)}
                      className={`w-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-3 rounded-xl transition cursor-pointer ${buttonClass}`}
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {rolePopup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-popup-title"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3
                  id="role-popup-title"
                  className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                >
                  {rolePopup.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeRolePopup}
                aria-label="Close popup"
                className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {rolePopup.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={closeRolePopup}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = rolePopup.signupHref;
                  setRolePopup(null);
                  router.push(target);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
              >
                <span>{rolePopup.signupLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}