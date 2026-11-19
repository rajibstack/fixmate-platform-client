import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { PublicPageSkeleton } from "@/components/ui/LoadingState";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FixMate - Repair Service Platform",
  description: "On-Demand Device & Home Appliance Repair Service Platform",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-slate-950 text-slate-100"
        suppressHydrationWarning={true}
      >
        <LayoutWrapper>
          <Suspense fallback={<PublicPageSkeleton cards={6} />}>
            {children}
          </Suspense>
        </LayoutWrapper>
      </body>
    </html>
  );
}