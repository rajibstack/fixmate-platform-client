"use client";

import { useEffect, useState } from "react";
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
  Menu,
  X,
} from "lucide-react";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.replace("/sign-in");
        return;
      }

      const currentUser = JSON.parse(storedUser);
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
      setCheckingAuth(false);
    } catch {
      router.replace("/sign-in");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/sign-in");
  };

  if (checkingAuth || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading workspace...
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
    ],
  };

  const navItems = [
    ...(menuByRole[user.role] || []),
    { name: "Update profile", href: "/dashboard/profile", icon: User },
  ];

  const currentTab =
    navItems.find((item) => item.href === pathname)?.name || "Overview";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-white">
                Fix<span className="text-sky-400">Mate</span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/25 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-900/70 backdrop-blur border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-400 font-medium">{currentTab}</span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white leading-none">{user.name}</p>
              <p className="text-xs text-slate-400 mt-1">{user.email}</p>
            </div>
            <span className="text-xs capitalize px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
              {user.role}
            </span>
            <div className="w-9 h-9 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-xs">
              {getInitials(user.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}