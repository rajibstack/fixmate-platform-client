"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wrench,
  Home,
  PlusCircle,
  Inbox,
  User,
  ChevronLeft,
  LogOut,
  CalendarCheck,
  CreditCard,
  Users,
  Settings,
  PanelLeft,
  X,
  MessageSquare,
} from "lucide-react";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

function getDashboardPath() {
  return "/dashboard/overview";
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

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const syncUserFromStorage = useCallback(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    try {
      const currentUser = syncUserFromStorage();
      if (!currentUser) {
        router.replace("/sign-in");
        return;
      }

      const role = currentUser?.role;
      if (!role) {
        router.replace("/sign-in");
        return;
      }

      const isSharedRoute =
        pathname === "/dashboard/profile" || pathname === "/dashboard/overview";

      if (!isSharedRoute) {
        if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
          router.replace(getDashboardPath(role));
          return;
        }
        if (pathname.startsWith("/dashboard/technician") && role !== "technician") {
          router.replace(getDashboardPath(role));
          return;
        }
        if (pathname.startsWith("/dashboard/customer") && role !== "customer") {
          router.replace(getDashboardPath(role));
          return;
        }
        if (pathname === "/dashboard") {
          router.replace(getDashboardPath(role));
          return;
        }
      }

      setUser(currentUser);
      setAvatarError(false);
      setCheckingAuth(false);
    } catch {
      router.replace("/sign-in");
    }
  }, [pathname, router, syncUserFromStorage]);

  useEffect(() => {
    const handleProfileOrAuthSync = () => {
      const updated = syncUserFromStorage();
      if (updated) {
        setUser(updated);
        setAvatarError(false);
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
  }, [pathname]);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/sign-in");
  };

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
        <DashboardPageSkeleton />
      </div>
    );
  }

  const menuByRole = {
    customer: [
      { name: "Overview", href: "/dashboard/overview", icon: Home },
      { name: "My bookings", href: "/dashboard/customer/bookings", icon: CalendarCheck },
      { name: "Payment history", href: "/dashboard/customer/payments", icon: CreditCard },
    ],
    technician: [
      { name: "Overview", href: "/dashboard/overview", icon: Home },
      { name: "Add a service", href: "/dashboard/technician/add-service", icon: PlusCircle },
      { name: "My services", href: "/dashboard/technician/my-services", icon: Wrench },
      { name: "Manage requests", href: "/dashboard/technician/requests", icon: Inbox },
    ],
    admin: [
      { name: "Overview", href: "/dashboard/overview", icon: Home },
      { name: "Manage users", href: "/dashboard/admin/users", icon: Users },
      { name: "Manage services", href: "/dashboard/admin/services", icon: Settings },
      { name: "All bookings", href: "/dashboard/admin/bookings", icon: CalendarCheck },
      { name: "Transactions", href: "/dashboard/admin/transactions", icon: CreditCard },
      { name: "Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
    ],
  };

  const navItems = [
    ...(menuByRole[user.role] || []),
    { name: "Update profile", href: "/dashboard/profile", icon: User },
  ];

  const currentTab =
    navItems.find((item) => item.href === pathname)?.name || "Overview";

  const showTopbarAvatar = Boolean(user?.avatar) && !avatarError;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-950 text-slate-100 flex">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Fixed Sidebar (Collapsible on Desktop, Drawer on Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-200 ease-out ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div
            className={`h-16 flex items-center border-b border-slate-800/80 sticky top-0 bg-slate-900 z-10 ${
              collapsed ? "lg:justify-center lg:px-2 px-5" : "justify-between px-5"
            }`}
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 text-xl font-bold min-w-0"
              title="FixMate"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <span
                className={`tracking-tight text-white whitespace-nowrap transition-opacity ${
                  collapsed ? "lg:hidden" : "inline"
                }`}
              >
                Fix<span className="text-sky-400">Mate</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Nav Items */}
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
                    collapsed ? "lg:justify-center lg:px-0 px-3.5 py-3" : "gap-3 px-3.5 py-3"
                  } ${
                    isActive
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/25 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={`truncate ${collapsed ? "lg:hidden" : "inline"}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1 bg-slate-900 shrink-0">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? "Back to site" : undefined}
            className={`flex items-center rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition ${
              collapsed ? "lg:justify-center lg:px-0 px-3.5 py-2.5" : "gap-3 px-3.5 py-2.5"
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
            className={`w-full cursor-pointer flex items-center rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition ${
              collapsed ? "lg:justify-center lg:px-0 px-3.5 py-2.5" : "gap-3 px-3.5 py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={`truncate ${collapsed ? "lg:hidden" : "inline"}`}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* Right Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen lg:h-screen transition-all duration-200 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Fixed Topbar */}
        <header className="sticky top-0 z-20 h-16 shrink-0 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition cursor-pointer shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-300 font-medium truncate">
              {currentTab}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-white leading-none truncate max-w-44">
                {user.name}
              </p>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-44">
                {user.email}
              </p>
            </div>
            <span className="text-[11px] sm:text-xs capitalize px-2.5 sm:px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
              {user.role}
            </span>
            {showTopbarAvatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User avatar"}
                onError={() => setAvatarError(true)}
                className="w-9 h-9 rounded-full object-cover border border-sky-500/30 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-xs shrink-0">
                {getInitials(user.name)}
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}