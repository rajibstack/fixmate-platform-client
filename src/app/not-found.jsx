"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Wrench, ArrowLeft } from "lucide-react";
import { DashboardPageSkeleton } from "@/components/ui/LoadingState";

export default function NotFoundPage() {
  const [navigating, setNavigating] = useState(false);

  if (navigating) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
        <DashboardPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
        {/* Repair / Tools Themed Illustration */}
        <div className="relative mx-auto w-44 h-36 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-sky-500/10 blur-xl" />
          <svg
            viewBox="0 0 200 150"
            className="relative w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Repair tools and missing part illustration"
          >
            {/* Workbench base */}
            <rect
              x="24"
              y="112"
              width="152"
              height="12"
              rx="6"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="2"
            />
            <rect x="40" y="124" width="12" height="16" rx="3" fill="#1e293b" />
            <rect x="148" y="124" width="12" height="16" rx="3" fill="#1e293b" />

            {/* Device / Circuit outline */}
            <rect
              x="54"
              y="44"
              width="92"
              height="60"
              rx="10"
              fill="#020617"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />

            {/* Question / Missing badge */}
            <circle cx="100" cy="74" r="16" fill="#0ea5e9" fillOpacity="0.16" />
            <text
              x="100"
              y="80"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="18"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              ?
            </text>

            {/* Wrench illustration (left) */}
            <g transform="translate(24, 24) rotate(-28)">
              <rect
                x="14"
                y="24"
                width="10"
                height="48"
                rx="4"
                fill="#1e293b"
                stroke="#94a3b8"
                strokeWidth="2"
              />
              <circle
                cx="19"
                cy="18"
                r="13"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <path
                d="M15 10L23 18L15 26"
                stroke="#020617"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>

            {/* Screwdriver illustration (right) */}
            <g transform="translate(142, 26) rotate(28)">
              <rect
                x="14"
                y="4"
                width="10"
                height="24"
                rx="4"
                fill="#0284c7"
              />
              <rect
                x="17"
                y="28"
                width="4"
                height="26"
                fill="#cbd5e1"
              />
              <path
                d="M16 54H22L20.5 66H17.5L16 54Z"
                fill="#38bdf8"
              />
            </g>
          </svg>
        </div>

        {/* Status & Message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25">
            <Wrench className="w-3.5 h-3.5" />
            <span>Error 404</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Page not found
          </h1>

          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The page or repair link you are looking for may have been moved,
            removed, or never existed.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            onClick={() => setNavigating(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-sky-500/20"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setNavigating(true);
              window.history.back();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm px-5 py-3 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>Go back</span>
          </button>
        </div>
      </div>
    </div>
  );
}