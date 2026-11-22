import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
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
  icons: {
    icon: [{ url: "/fixmate.png", type: "image/png" }],
    shortcut: ["/fixmate.png"],
    apple: [{ url: "/fixmate.png", type: "image/png" }],
  },
};

const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem("fixmate_theme");
      var theme = (saved === "light" || saved === "dark") ? saved : "light";
      var root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      root.setAttribute("data-theme", theme);
      root.style.colorScheme = theme;
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} light h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(14,165,233,0.12),rgba(255,255,255,1))] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>
          <Toaster
            position="bottom-right"
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
        </ThemeProvider>
      </body>
    </html>
  );
}