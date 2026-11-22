"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wrench,
  Home,
  LayoutDashboard,
  PlusCircle,
  Inbox,
  User,
  ChevronLeft,
  ChevronDown,
  LogOut,
  CalendarCheck,
  CreditCard,
  Users,
  Settings,
  PanelLeft,
  X,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";
import { ThemeToggle } from "@/components/ThemeProvider";

function normalizeRole(role = "") {
  return role.toString().toLowerCase().trim();
}

function getDashboardPath(role = "") {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "/dashboard/admin";
  if (normalized === "technician") return "/dashboard/technician";
  return "/dashboard/customer";
}

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

function readUserFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = localStorage.getItem("user");
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    if (!storedUser) return null;
    const parsed = JSON.parse(storedUser);
    if (!parsed || typeof parsed !== "object") return null;

    const hasToken = Boolean(token || parsed.token);
    if (!hasToken) return null;

    const normalized = normalizeRole(parsed.role);
    return {
      ...parsed,
      role: normalized || parsed.role,
    };
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const syncUserFromStorage = useCallback(() => {
    return readUserFromStorage();
  }, []);

  useEffect(() => {
    const currentUser = syncUserFromStorage();
    if (!currentUser) {
      setUser(null);
      setCheckingAuth(false);
      if (pathname !== "/sign-in") {
        router.replace("/sign-in");
      }
      return;
    }

    const role = normalizeRole(currentUser?.role);
    if (!role) {
      setUser(null);
      setCheckingAuth(false);
      if (pathname !== "/sign-in") {
        router.replace("/sign-in");
      }
      return;
    }

    const roleHomePath = getDashboardPath(role);

    if (pathname === "/dashboard" || pathname === "/dashboard/overview") {
      router.replace(roleHomePath);
      return;
    }

    if (pathname !== "/dashboard/profile") {
      if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
        router.replace(roleHomePath);
        return;
      }
      if (
        pathname.startsWith("/dashboard/technician") &&
        role !== "technician"
      ) {
        router.replace(roleHomePath);
        return;
      }
      if (pathname.startsWith("/dashboard/customer") && role !== "customer") {
        router.replace(roleHomePath);
        return;
      }
    }

    setUser(currentUser);
    setAvatarError(false);
    setCheckingAuth(false);
  }, [pathname, router, syncUserFromStorage]);

  useEffect(() => {
    const handleProfileOrAuthSync = () => {
      const updated = syncUserFromStorage();
      if (updated) {
        setUser(updated);
        setAvatarError(false);
      } else {
        setUser(null);
      }
    };

    window.addEventListener("auth-change", handleProfileOrAuthSync);
    window.addEventListener("storage", handleProfileOrAuthSync);

    return () => {
      window.removeEventListener("auth-change", handleProfileOrAuthSync);
      window.removeEventListener("storage", handleProfileOrAuthSync);
    };
  }, [syncUserFromStorage]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        setProfileMenuOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    setProfileMenuOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    toast.success("Signed out successfully.");
    router.push("/sign-in");
  };

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        <DashboardPageSkeleton />
      </div>
    );
  }

  const activeRole = normalizeRole(user.role);

  const menuByRole = {
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
      {
        name: "Overview",
        href: "/dashboard/technician",
        icon: LayoutDashboard,
      },
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

  const navItems = [
    ...(menuByRole[activeRole] || []),
    { name: "Update profile", href: "/dashboard/profile", icon: User },
  ];

  const currentTab =
    navItems.find((item) => item.href === pathname)?.name || "Overview";

  const showTopbarAvatar = Boolean(user?.avatar) && !avatarError;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-200 ease-out ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } w-64 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <div
            className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-800/80 sticky top-0 bg-white dark:bg-slate-900 z-10 ${
              collapsed
                ? "lg:justify-center lg:px-2 px-5"
                : "justify-between px-5"
            }`}
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 text-xl font-bold min-w-0"
              title="FixMate"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <span
                className={`tracking-tight text-slate-900 dark:text-white whitespace-nowrap transition-opacity ${
                  collapsed ? "lg:hidden" : "inline"
                }`}
              >
                Fix
                <span className="text-sky-600 dark:text-sky-400">Mate</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-3 space-y-1.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center rounded-xl text-sm font-medium transition ${
                    collapsed
                      ? "lg:justify-center lg:px-0 px-3.5 py-3"
                      : "gap-3 px-3.5 py-3"
                  } ${
                    isActive
                      ? "bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/25 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span
                    className={`truncate ${collapsed ? "lg:hidden" : "inline"}`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900 shrink-0">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Back to site" : undefined}
            className={`flex items-center rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition ${
              collapsed
                ? "lg:justify-center lg:px-0 px-3.5 py-2.5"
                : "gap-3 px-3.5 py-2.5"
            }`}
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className={`truncate ${collapsed ? "lg:hidden" : "inline"}`}>
              Back to site
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full cursor-pointer flex items-center rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition ${
              collapsed
                ? "lg:justify-center lg:px-0 px-3.5 py-2.5"
                : "gap-3 px-3.5 py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={`truncate ${collapsed ? "lg:hidden" : "inline"}`}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen lg:h-screen transition-all duration-200 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 h-16 shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <Link
              href="/"
              aria-label="Go to home page"
              title="Home"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition shrink-0"
            >
              <Home className="w-4 h-4" />
            </Link>

            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
              {currentTab}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <ThemeToggle />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                aria-label="Open account and role menu"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 transition cursor-pointer"
              >
                {showTopbarAvatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User avatar"}
                    onError={() => setAvatarError(true)}
                    className="w-8 h-8 rounded-full object-cover border border-sky-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xs shrink-0">
                    {getInitials(user.name)}
                  </div>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-150 ${
                    profileMenuOpen
                      ? "rotate-180 text-sky-600 dark:text-sky-400"
                      : ""
                  }`}
                />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2.5 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    {showTopbarAvatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User avatar"}
                        onError={() => setAvatarError(true)}
                        className="w-11 h-11 rounded-full object-cover border border-sky-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xs shrink-0">
                        {getInitials(user.name)}
                      </div>
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
                        {activeRole || "customer"}
                      </span>
                    </div>
                  </div>

                  <div className="py-1.5 max-h-80 overflow-y-auto">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setProfileMenuOpen(false)}
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
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}