import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans`}
        suppressHydrationWarning={true}
      >
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: "#0EA6F4",
              border: "1px solid #0EA6F4",
              color: "#ffffff",
              borderRadius: "14px",
            },
          }}
        />
        <LayoutWrapper>
          <Suspense fallback={<PublicPageSkeleton cards={6} />}>
            {children}
          </Suspense>
        </LayoutWrapper>
      </body>
    </html>
  );
}