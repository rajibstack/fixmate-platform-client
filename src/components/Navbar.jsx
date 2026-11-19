"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wrench, ChevronDown, LayoutDashboard, User, LogOut } from "lucide-react";

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

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);

  const loadUser = useCallback(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) {
        setUser(null);
        setAvatarError(false);
        return;
      }
      const parsed = JSON.parse(stored);
      setUser(parsed && typeof parsed === "object" ? parsed : null);
      setAvatarError(false);
    } catch {
      setUser(null);
      setAvatarError(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

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
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/sign-in");
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const showAvatarImage = Boolean(user?.avatar) && !avatarError;

  return (
    <header className="sticky top-0 z-40 h-16 bg-slate-950/85 backdrop-blur border-b border-slate-800/80 text-slate-100">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold shrink-0">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="tracking-tight text-white">
            Fix<span className="text-sky-400">Mate</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  active ? "text-sky-400" : "text-slate-300 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {!user ? (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg transition"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-xl transition shadow-md shadow-sky-500/20"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
              >
                {showAvatarImage ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User avatar"}
                    onError={() => setAvatarError(true)}
                    className="w-8 h-8 rounded-full object-cover border border-sky-500/30"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-xs">
                    {getInitials(user.name)}
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
                    menuOpen ? "rotate-180 text-sky-400" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                    {showAvatarImage ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User avatar"}
                        onError={() => setAvatarError(true)}
                        className="w-10 h-10 rounded-full object-cover border border-sky-500/30 shrink-0"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 font-bold text-xs shrink-0">
                        {getInitials(user.name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">
                        {user.name || "FixMate User"}
                      </p>
                      {user.email && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                      <span className="inline-block mt-1.5 text-xs capitalize px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 font-semibold">
                        {user.role || "customer"}
                      </span>
                    </div>
                  </div>

                  <div className="py-1.5">
                    <Link
                      href="/dashboard/overview"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800/80 hover:text-sky-400 transition"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/dashboard/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800/80 hover:text-sky-400 transition"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Update profile</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-800 py-1.5">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}