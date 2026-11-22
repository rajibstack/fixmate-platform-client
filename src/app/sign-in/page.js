"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wrench } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { FixMateSpinner, PublicPageSkeleton } from "@/components/ui/LoadingState";

const DEMO_PASSWORD = "FixMate@123";

const DEMO_ACCOUNTS = [
  {
    roleLabel: "Customer",
    email: "arif.customer@fixmate.app",
    password: DEMO_PASSWORD,
    summary: "Arif Chowdhury: bookings across statuses & payments",
  },
  {
    roleLabel: "Technician",
    email: "tariq.tech@fixmate.app",
    password: DEMO_PASSWORD,
    summary: "Tariq Mahmud: smartphone, laptop & TV repairs",
  },
  {
    roleLabel: "Technician",
    email: "nadia.tech@fixmate.app",
    password: DEMO_PASSWORD,
    summary: "Nadia Rahman: AC, appliances & electrical",
  },
  {
    roleLabel: "Admin",
    email: "admin@fixmate.app",
    password: DEMO_PASSWORD,
    summary: "FixMate Admin: service approvals, users & bookings",
  },
];

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

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeRedirect = getSafeRedirectPath(searchParams.get("redirect"));

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Sign In Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl dark:shadow-2xl">
          <div className="mb-8">
            <Link
              href="/"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center gap-2.5 text-2xl font-bold text-sky-600 dark:text-sky-400 group mb-4"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20 transition shadow-inner">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-slate-900 dark:text-white">
                Fix
                <span className="text-sky-600 dark:text-sky-400">Mate</span>
              </span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Welcome back
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                onClick={() => setNavigating(true)}
                className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
              >
                Create one
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {isBusy ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full cursor-pointer disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold py-3.5 rounded-xl transition text-sm shadow-lg shadow-sky-500/20"
              >
                Sign in
              </button>

              {googleClientId ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleGoogleLogin()}
                  className="w-full cursor-pointer disabled:cursor-not-allowed bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-3 shadow-xs dark:shadow-none"
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

        {/* Right Column: Seed Demo Accounts */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-center shadow-xl dark:shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Demo accounts
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Pick one to sign in instantly and test that role.
            </p>
          </div>

          <div className="space-y-3.5">
            {DEMO_ACCOUNTS.map((account) => {
              const isSelected =
                formData.email.toLowerCase() === account.email.toLowerCase();
              return (
                <button
                  key={account.email}
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDemoLogin(account)}
                  className={`w-full text-left rounded-2xl border p-4 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    isSelected
                      ? "bg-slate-100 dark:bg-slate-950 border-sky-500/70 ring-1 ring-sky-500/30"
                      : "bg-slate-50 dark:bg-slate-950/75 border-slate-200 dark:border-slate-800 hover:border-sky-500/40 hover:bg-slate-100 dark:hover:bg-slate-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {account.roleLabel}:{" "}
                        <span className="text-sky-600 dark:text-sky-400 font-medium">
                          {account.email}
                        </span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {account.summary}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg shrink-0">
                      {account.password}
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