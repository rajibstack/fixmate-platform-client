"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Wrench } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { FixMateSpinner, PublicPageSkeleton } from "@/components/ui/LoadingState";

const ACCOUNT_TYPE_NOTES = [
  "Customers book and pay only after the job is completed.",
  "Technicians list services after a quick review by our team.",
  "Admin accounts are created by FixMate, not through sign-up.",
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

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeRedirect = getSafeRedirectPath(searchParams.get("redirect"));

  const [accountType, setAccountType] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
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
        throw new Error("Invalid registration response from server.");
      }

      const normalizedUser = {
        ...data.user,
        role: (data.user.role || accountType || "customer")
          .toString()
          .toLowerCase()
          .trim(),
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      window.dispatchEvent(new Event("auth-change"));
      toast.success(
        normalizedUser.name
          ? `Welcome to FixMate, ${normalizedUser.name}!`
          : fallbackSuccessMsg
      );
      setNavigating(true);
      router.push(safeRedirect || getDashboardPath(normalizedUser.role));
    },
    [accountType, router, safeRedirect]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();

    if (!trimmedName) {
      const msg = "Please enter your full name.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (
      formData.password.length < 6 ||
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password)
    ) {
      const msg = "Please meet all password requirements.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: formData.password,
          role: accountType,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || "Registration failed";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      completeAuthSession(data, "Account created successfully!");
    } catch (err) {
      const msg =
        err?.message || "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = useGoogleLogin({
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
            role: accountType,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data?.message || "Google sign-up failed";
          setError(msg);
          toast.error(msg);
          setGoogleLoading(false);
          return;
        }

        completeAuthSession(data, "Signed up with Google successfully!");
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
    return <PublicPageSkeleton cards={1} />;
  }

  const isBusy = loading || googleLoading;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors duration-200">
      <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[780px] h-[360px] rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative w-full max-w-4xl bg-gradient-to-tl from-sky-500/15 via-sky-500/[0.04] to-white dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 backdrop-blur-md border border-sky-500/25 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md dark:shadow-2xl">
        <div className="text-center mb-6">
          <Link
            href="/"
            onClick={() => setNavigating(true)}
            className="inline-flex items-center justify-center gap-2 text-2xl font-bold text-sky-600 dark:text-sky-400 group mb-2.5"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20 transition shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-slate-900 dark:text-white">
              Fix<span className="text-sky-600 dark:text-sky-400">Mate</span>
            </span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
            One account for every repair in your home
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {isBusy ? (
          <div className="rounded-2xl bg-white/80 dark:bg-slate-950/80 border border-sky-500/20 dark:border-slate-800 px-4 py-8">
            <FixMateSpinner
              label={
                googleLoading
                  ? "Connecting to Google..."
                  : "Creating your account..."
              }
              compact
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Account type
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setAccountType("customer")}
                  className={`text-left cursor-pointer border rounded-2xl p-3.5 transition ${
                    accountType === "customer"
                      ? "border-sky-500 bg-sky-500/15 text-slate-900 dark:text-white ring-1 ring-sky-500/30"
                      : "border-sky-500/20 dark:border-slate-800 bg-white/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-sky-500/40 dark:hover:border-slate-700"
                  }`}
                >
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    I need a repair as a Customer
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Book technicians and track your jobs.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType("technician")}
                  className={`text-left cursor-pointer border rounded-2xl p-3.5 transition ${
                    accountType === "technician"
                      ? "border-sky-500 bg-sky-500/15 text-slate-900 dark:text-white ring-1 ring-sky-500/30"
                      : "border-sky-500/20 dark:border-slate-800 bg-white/80 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-sky-500/40 dark:hover:border-slate-700"
                  }`}
                >
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">
                    I fix things as a Technician
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    List services and manage incoming jobs.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 bg-white/85 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 bg-white/85 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative mb-2">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className="w-full pl-4 pr-11 py-2.5 bg-white/85 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition text-sm"
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

                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        formData.password.length >= 6
                          ? "bg-sky-500 dark:bg-sky-400"
                          : "bg-slate-400 dark:bg-slate-600"
                      }`}
                    />
                    At least 6 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        /[A-Z]/.test(formData.password)
                          ? "bg-sky-500 dark:bg-sky-400"
                          : "bg-slate-400 dark:bg-slate-600"
                      }`}
                    />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        /[a-z]/.test(formData.password)
                          ? "bg-sky-500 dark:bg-sky-400"
                          : "bg-slate-400 dark:bg-slate-600"
                      }`}
                    />
                    One lowercase letter
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-white/80 dark:bg-slate-950/75 border border-sky-500/20 dark:border-slate-800 p-3.5 sm:mt-6">
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {ACCOUNT_TYPE_NOTES.map((note) => (
                    <li key={note} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 mt-1.5 shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <button
                type="submit"
                disabled={isBusy}
                className="w-full cursor-pointer disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-sky-500/20"
              >
                Create account
              </button>

              {googleClientId ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleGoogleSignUp()}
                  className="w-full cursor-pointer disabled:cursor-not-allowed bg-white/90 dark:bg-slate-950 hover:bg-sky-500/10 dark:hover:bg-slate-800 disabled:opacity-50 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-medium py-3 rounded-xl transition text-sm flex items-center justify-center gap-3 shadow-xs dark:shadow-none"
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
            </div>
          </form>
        )}

        <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 pt-5">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            onClick={() => setNavigating(true)}
            className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
    >
      <Suspense fallback={<PublicPageSkeleton cards={1} />}>
        <SignUpContent />
      </Suspense>
    </GoogleOAuthProvider>
  );
}
