"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Wrench } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { FixMateSpinner, PublicPageSkeleton } from "@/components/ui/LoadingState";

const DEMO_PASSWORD = "FixMate@123";

const INITIAL_DEMO_ACCOUNTS = [
   {
    name: "FixMate Admin",
    roleLabel: "Admin",
    email: "admin@fixmate.app",
    password: DEMO_PASSWORD,
    avatar: "",
  },
  {
    name: "Tariq Mahmud",
    roleLabel: "Technician",
    email: "tariq.tech@fixmate.app",
    password: DEMO_PASSWORD,
    avatar: "",
  },
  {
    name: "Nadia Rahman",
    roleLabel: "Technician",
    email: "nadia.tech@fixmate.app",
    password: DEMO_PASSWORD,
    avatar: "",
  },
  {
    name: "Arif Chowdhury",
    roleLabel: "Customer",
    email: "arif.customer@fixmate.app",
    password: DEMO_PASSWORD,
    avatar: "",
  }
];

const roleBadgeStyles = {
  Customer:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  Technician:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  Admin:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

function formatRoleLabel(role) {
  const normalized = String(role || "customer").toLowerCase().trim();
  if (normalized === "admin") return "Admin";
  if (normalized === "technician") return "Technician";
  return "Customer";
}

function getDashboardPath(role) {
  const normalized = (role || "customer").toString().toLowerCase().trim();
  if (normalized === "admin") return "/dashboard/admin";
  if (normalized === "technician") return "/dashboard/technician";
  return "/dashboard/customer";
}

function getSafeRedirectPath(rawRedirect) {
  if (!rawRedirect || typeof rawRedirect !== "string") return "";
  const trimmed = rawRedirect.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "";
  return trimmed;
}

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function extractAvatarFromUser(userObj) {
  if (!userObj || typeof userObj !== "object") return undefined;
  if (userObj.avatar !== undefined) return String(userObj.avatar || "").trim();
  if (userObj.image !== undefined) return String(userObj.image || "").trim();
  if (userObj.photo !== undefined) return String(userObj.photo || "").trim();
  if (userObj.profileImage !== undefined) {
    return String(userObj.profileImage || "").trim();
  }
  return undefined;
}

function DemoUserAvatar({ src, name }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const initials = String(name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  if (!src || imgFailed) {
    return (
      <div className="w-14 h-14 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 font-bold text-sm flex items-center justify-center shrink-0 select-none">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgFailed(true)}
      className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
    />
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeRedirect = getSafeRedirectPath(searchParams.get("redirect"));

  const [demoAccounts, setDemoAccounts] = useState(INITIAL_DEMO_ACCOUNTS);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const syncDemoUsersFromSources = useCallback(async () => {
    const candidates = [];

    try {
      const listRes = await fetch(
        `${apiUrl}/api/auth/demo-users?_t=${Date.now()}`,
        {
          cache: "no-store",
        }
      );
      if (listRes.ok) {
        const listData = await listRes.json().catch(() => null);
        const list = Array.isArray(listData?.data)
          ? listData.data
          : Array.isArray(listData?.users)
          ? listData.users
          : Array.isArray(listData)
          ? listData
          : [];
        candidates.push(...list);
      }
    } catch {
      // ignore if endpoint unavailable
    }

    const token = getStoredToken();
    if (token) {
      try {
        const meRes = await fetch(`${apiUrl}/api/auth/me?_t=${Date.now()}`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json().catch(() => null);
          const meUser = meData?.user || meData?.data?.user || meData?.data;
          if (meUser && typeof meUser === "object") {
            candidates.push(meUser);
          }
        }
      } catch {
        // ignore network error
      }
    }

    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          candidates.push(parsed);
        }
      }
    } catch {
      // ignore storage parse error
    }

    if (!candidates.length) return;

    setDemoAccounts((prev) =>
      prev.map((acc) => {
        const matches = candidates.filter(
          (u) =>
            String(u?.email || "").toLowerCase().trim() ===
            acc.email.toLowerCase()
        );
        if (!matches.length) return acc;

        let resolvedAvatar = acc.avatar;
        let resolvedName = acc.name;
        let resolvedRole = acc.roleLabel;

        for (const matched of matches) {
          if (matched.name) resolvedName = String(matched.name).trim();
          if (matched.role) resolvedRole = formatRoleLabel(matched.role);
          const extracted = extractAvatarFromUser(matched);
          if (extracted !== undefined) {
            resolvedAvatar = extracted;
          }
        }

        return {
          ...acc,
          name: resolvedName,
          roleLabel: resolvedRole,
          avatar: resolvedAvatar,
        };
      })
    );
  }, [apiUrl]);

  useEffect(() => {
    let active = true;

    const runSync = () => {
      if (!active) return;
      syncDemoUsersFromSources();
    };

    runSync();
    window.addEventListener("storage", runSync);
    window.addEventListener("auth-change", runSync);
    window.addEventListener("focus", runSync);

    return () => {
      active = false;
      window.removeEventListener("storage", runSync);
      window.removeEventListener("auth-change", runSync);
      window.removeEventListener("focus", runSync);
    };
  }, [syncDemoUsersFromSources]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUser = localStorage.getItem("user");
      const token = getStoredToken();

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === "object" && parsedUser.role) {
          setNavigating(true);
          router.replace(safeRedirect || getDashboardPath(parsedUser.role));
        }
      }
    } catch {
      localStorage.removeItem("user");
    }
  }, [router, safeRedirect]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const completeAuthSession = useCallback(
    (data, fallbackSuccessMsg) => {
      if (!data?.token || !data?.user) {
        throw new Error("Invalid authentication response from server.");
      }

      const normalizedUser = {
        ...data.user,
        role: (data.user.role || "customer").toString().toLowerCase().trim(),
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      window.dispatchEvent(new Event("auth-change"));
      toast.success(
        normalizedUser.name
          ? `Welcome back, ${normalizedUser.name}!`
          : fallbackSuccessMsg
      );
      setNavigating(true);
      router.push(safeRedirect || getDashboardPath(normalizedUser.role));
    },
    [router, safeRedirect]
  );

  const authenticateWithEmail = useCallback(
    async (email, password) => {
      setError("");
      setLoading(true);

      try {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data?.message || "Invalid credentials";
          setError(msg);
          toast.error(msg);
          setLoading(false);
          return;
        }

        completeAuthSession(data, "Signed in successfully!");
      } catch (err) {
        const msg =
          err?.message || "Something went wrong. Please try again.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
      }
    },
    [apiUrl, completeAuthSession]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await authenticateWithEmail(formData.email, formData.password);
  };

  const handleDemoLogin = async (account) => {
    setFormData({ email: account.email, password: account.password });
    await authenticateWithEmail(account.email, account.password);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiUrl}/api/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: tokenResponse?.access_token,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data?.message || "Google sign-in failed";
          setError(msg);
          toast.error(msg);
          setGoogleLoading(false);
          return;
        }

        completeAuthSession(data, "Signed in with Google successfully!");
      } catch (err) {
        const msg =
          err?.message || "Google authentication failed. Please try again.";
        setError(msg);
        toast.error(msg);
        setGoogleLoading(false);
      }
    },
    onError: () => {
      const msg = "Google sign-in popup closed or failed.";
      setError(msg);
      toast.error(msg);
      setGoogleLoading(false);
    },
  });

  if (navigating) {
    return <PublicPageSkeleton cards={2} />;
  }

  const isBusy = loading || googleLoading;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[780px] h-[360px] rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Sign-In */}
        <div className="h-full w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          <div>
            <div className="text-center mb-6">
              <Link
                href="/"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-sky-600 dark:text-sky-400 group mb-3"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20 transition shadow-inner">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="tracking-tight text-slate-900 dark:text-white">
                  Fix<span className="text-sky-600 dark:text-sky-400">Mate</span>
                </span>
              </Link>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Enter your details to access your FixMate account
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {isBusy ? (
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-8">
                <FixMateSpinner
                  label={
                    googleLoading
                      ? "Connecting to Google..."
                      : "Signing you in..."
                  }
                  compact
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="signin-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full cursor-pointer disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-sky-500/20"
                >
                  Sign in
                </button>

                {googleClientId ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleGoogleLogin()}
                    className="w-full cursor-pointer disabled:cursor-not-allowed bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium py-3 rounded-xl transition text-sm flex items-center justify-center gap-3 shadow-xs dark:shadow-none"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                ) : null}
              </form>
            )}
          </div>

          <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-5">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              onClick={() => setNavigating(true)}
              className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Right Card: Demo Accounts (Same Height as Left Card) */}
        <div className="h-full w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Quick Access
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
              Demo accounts
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-3 my-5">
            {demoAccounts.map((account) => {
              const isSelected =
                formData.email.toLowerCase() === account.email.toLowerCase();

              return (
                <button
                  key={account.email}
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDemoLogin(account)}
                  className={`w-full text-left rounded-2xl border p-3.5 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "bg-sky-500/10 dark:bg-slate-950 border-sky-500 ring-1 ring-sky-500/30"
                      : "bg-slate-50 dark:bg-slate-950/75 border-slate-200 dark:border-slate-800 hover:border-sky-500/40 hover:bg-slate-100 dark:hover:bg-slate-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <DemoUserAvatar
                        src={account.avatar}
                        name={account.name}
                      />
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {account.name}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                        roleBadgeStyles[account.roleLabel] ||
                        roleBadgeStyles.Customer
                      }`}
                    >
                      {account.roleLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
    >
      <Suspense fallback={<PublicPageSkeleton cards={2} />}>
        <LoginContent />
      </Suspense>
    </GoogleOAuthProvider>
  );
}