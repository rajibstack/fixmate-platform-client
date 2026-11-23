"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wrench,
  ChevronDown,
  LayoutDashboard,
  PlusCircle,
  Inbox,
  CalendarCheck,
  CreditCard,
  Users,
  Settings,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Info,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeProvider";

const MENU_BY_ROLE = {
  customer: [
    { name: "Overview", href: "/dashboard/customer", icon: LayoutDashboard },
    {
      name: "My bookings",
      href: "/dashboard/customer/bookings",
      icon: CalendarCheck,
    },
    {
      name: "Payment history",
      href: "/dashboard/customer/payments",
      icon: CreditCard,
    },
  ],
  technician: [
    { name: "Overview", href: "/dashboard/technician", icon: LayoutDashboard },
    {
      name: "Add a service",
      href: "/dashboard/technician/add-service",
      icon: PlusCircle,
    },
    {
      name: "My services",
      href: "/dashboard/technician/my-services",
      icon: Wrench,
    },
    {
      name: "Manage requests",
      href: "/dashboard/technician/requests",
      icon: Inbox,
    },
  ],
  admin: [
    { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { name: "Manage users", href: "/dashboard/admin/users", icon: Users },
    {
      name: "Manage services",
      href: "/dashboard/admin/services",
      icon: Settings,
    },
    {
      name: "All bookings",
      href: "/dashboard/admin/bookings",
      icon: CalendarCheck,
    },
    {
      name: "Transactions",
      href: "/dashboard/admin/transactions",
      icon: CreditCard,
    },
    {
      name: "Messages",
      href: "/dashboard/admin/messages",
      icon: MessageSquare,
    },
  ],
};

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

function readStoredSessionUser() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;

    const hasToken = Boolean(token || parsed.token);
    if (!hasToken) return null;

    return {
      ...parsed,
      role: (parsed.role || "customer").toString().toLowerCase().trim(),
    };
  } catch {
    return null;
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);

  const loadUser = useCallback(() => {
    const sessionUser = readStoredSessionUser();
    setUser(sessionUser);
    setAvatarError(false);
  }, []);

  useEffect(() => {
    loadUser();
    setMobileNavOpen(false);
    setMenuOpen(false);

    const handleAuthChange = () => {
      loadUser();
      setMenuOpen(false);
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [loadUser, pathname]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(e.target)
      ) {
        setMobileNavOpen(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    setMobileNavOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    toast.success("Signed out successfully.");
    router.push("/sign-in");
  };

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Services", href: "/services", icon: Wrench },
    { name: "About Us", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Phone },
  ];

  const isNavItemActive = (href) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const showAvatarImage = Boolean(user?.avatar) && !avatarError;

  const dropdownMenuItems = user
    ? [
        ...(MENU_BY_ROLE[user.role] || MENU_BY_ROLE.customer),
        { name: "Update profile", href: "/dashboard/profile", icon: User },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/85 backdrop-blur border-b border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto h-16 px-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Mobile Toggle + Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label={
              mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileNavOpen}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer shrink-0"
          >
            {mobileNavOpen ? (
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2.5 text-base sm:text-xl font-bold shrink-0 whitespace-nowrap"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="tracking-tight text-slate-900 dark:text-white">
              Fix<span className="text-sky-600 dark:text-sky-400">Mate</span>
            </span>
          </Link>
        </div>

        {/* Desktop & Laptop Nav Links with Icons */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 lg:gap-10"
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 text-sm font-medium transition whitespace-nowrap ${
                  active
                    ? "text-sky-600 dark:text-sky-400 font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active
                      ? "text-sky-600 dark:text-sky-400"
                      : "text-slate-400 dark:text-slate-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Theme Toggle + Auth / Profile Dropdown */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ThemeToggle />

          {!user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link
                href="/sign-in"
                className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap shrink-0"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-xs sm:text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition shadow-md shadow-sky-500/20 whitespace-nowrap shrink-0"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition cursor-pointer shrink-0"
              >
                {showAvatarImage ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User avatar"}
                    onError={() => setAvatarError(true)}
                    className="w-8 h-8 rounded-full object-cover border border-sky-500/30"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xs">
                    {getInitials(user.name)}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-150 ${
                    menuOpen ? "rotate-180 text-sky-600 dark:text-sky-400" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2.5 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    {showAvatarImage ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User avatar"}
                        onError={() => setAvatarError(true)}
                        className="w-10 h-10 rounded-full object-cover border border-sky-500/30 shrink-0"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-sky-500/15 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xs shrink-0">
                        {getInitials(user.name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.name || "FixMate User"}
                      </p>
                      {user.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                      <span className="inline-block mt-1.5 text-xs capitalize px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/25 font-semibold">
                        {user.role || "customer"}
                      </span>
                    </div>
                  </div>

                  <div className="py-1.5 max-h-80 overflow-y-auto">
                    {dropdownMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                            isActive
                              ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 font-semibold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-sky-600 dark:hover:text-sky-400"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? "text-sky-600 dark:text-sky-400"
                                : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 py-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compact Mobile Page Menu Card */}
      {mobileNavOpen && (
        <nav
          ref={mobileMenuRef}
          aria-label="Mobile Navigation"
          className="md:hidden absolute left-3 mt-1.5 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50"
        >
          <div className="px-3.5 py-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Wrench className="w-3.5 h-3.5" />
              </span>
              <span>
                Fix<span className="text-sky-600 dark:text-sky-400">Mate</span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-1 space-y-0.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition ${
                    active
                      ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 font-semibold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-sky-600 dark:hover:text-sky-400"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active
                        ? "text-sky-600 dark:text-sky-400"
                        : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}