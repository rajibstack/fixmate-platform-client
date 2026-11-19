"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { FixMateSpinner, PublicPageSkeleton } from "@/components/ui/LoadingState";

function getDashboardPath(role) {
  if (role === "admin") return "/dashboard/admin";
  if (role === "technician") return "/dashboard/technician";
  return "/dashboard/customer";
}

function SignUpContent() {
  const router = useRouter();
  const [accountType, setAccountType] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.role) {
          setNavigating(true);
          router.replace(getDashboardPath(parsedUser.role));
        }
      }
    } catch {
      localStorage.removeItem("user");
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      formData.password.length < 6 ||
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password)
    ) {
      setError("Please meet all password requirements.");
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
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: accountType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
      router.push(getDashboardPath(data.user?.role));
    } catch (err) {
      setError("Something went wrong. Please try again.");
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
            access_token: tokenResponse.access_token,
            role: accountType,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Google sign-up failed");
          setGoogleLoading(false);
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("auth-change"));
        router.push(getDashboardPath(data.user?.role));
      } catch (err) {
        setError("Google authentication failed. Please try again.");
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google sign-in popup closed or failed.");
      setGoogleLoading(false);
    },
  });

  if (navigating) {
    return <PublicPageSkeleton cards={2} />;
  }

  const isBusy = loading || googleLoading;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="mb-8">
            <Link
              href="/"
              onClick={() => setNavigating(true)}
              className="inline-flex items-center gap-2.5 text-2xl font-bold text-sky-400 group mb-4"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition shadow-inner">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-white">Fix<span className="text-sky-400">Mate</span></span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create your account</h1>
            <p className="text-slate-400 text-sm">
              Already have one?{" "}
              <Link
                href="/sign-in"
                onClick={() => setNavigating(true)}
                className="text-sky-400 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {isBusy ? (
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-4">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Account type</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setAccountType("customer")}
                    className={`cursor-pointer border rounded-2xl p-4 transition ${
                      accountType === "customer"
                        ? "border-sky-500 bg-sky-500/10 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">I need a repair</p>
                    <p className="text-xs text-slate-400 leading-relaxed">Book technicians and track your jobs.</p>
                  </div>
                  <div
                    onClick={() => setAccountType("technician")}
                    className={`cursor-pointer border rounded-2xl p-4 transition ${
                      accountType === "technician"
                        ? "border-sky-500 bg-sky-500/10 text-white"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <p className="font-semibold text-white mb-1">I fix things</p>
                    <p className="text-xs text-slate-400 leading-relaxed">List services and manage incoming jobs.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition text-sm mb-3"
                />
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${formData.password.length >= 6 ? "bg-sky-400" : "bg-slate-600"}`}></span>
                    At least 6 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? "bg-sky-400" : "bg-slate-600"}`}></span>
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(formData.password) ? "bg-sky-400" : "bg-slate-600"}`}></span>
                    One lowercase letter
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full cursor-pointer disabled:cursor-not-allowed bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold py-3.5 rounded-xl transition text-sm shadow-lg shadow-sky-500/20"
              >
                Create account
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleGoogleSignUp()}
                className="w-full cursor-pointer disabled:cursor-not-allowed bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 text-white font-medium py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 flex flex-col justify-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6 shadow-inner">
            <Wrench className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-snug">
            One account for every repair in your home.
          </h2>
          <ul className="space-y-4 text-slate-300 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0"></span>
              <span>Customers book and pay only after the job is completed.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0"></span>
              <span>Technicians list services after a quick review by our team.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-sky-400 mt-2 flex-shrink-0"></span>
              <span>Admin accounts are created by FixMate, not through sign-up.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <SignUpContent />
    </GoogleOAuthProvider>
  );
}