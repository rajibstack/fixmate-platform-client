import Link from "next/link";
import { Wrench, Mail, Phone, MapPin, ChevronRight } from "lucide-react";

export default function Footer() {
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "FixMate Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Sign In", href: "/sign-in" },
    { label: "Create Account", href: "/sign-up" },
  ];

  const popularCategories = [
    { label: "Smartphone Repair", href: "/services?category=Smartphone" },
    { label: "Laptop & PC Servicing", href: "/services?category=Laptop%20%26%20PC" },
    { label: "AC Maintenance", href: "/services?category=AC" },
    { label: "Refrigerator Repair", href: "/services?category=Refrigerator" },
    { label: "Electrical Wiring", href: "/services?category=Electrical" },
  ];

  return (
    <footer className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-10 sm:pt-16 pb-10 sm:pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-10 mb-8 sm:mb-12">
          {/* Brand & Tagline */}
          <div className="lg:col-span-4 rounded-2xl sm:rounded-none bg-slate-50/90 dark:bg-slate-950/40 sm:bg-transparent sm:dark:bg-transparent p-5 sm:p-0 border border-slate-200/80 dark:border-slate-800/80 sm:border-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-xl font-bold text-sky-600 dark:text-sky-400 group mb-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20 transition shadow-inner">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-slate-900 dark:text-white text-2xl">
                Fix<span className="text-sky-600 dark:text-sky-400">Mate</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-5">
              Your trusted partner for on-demand smart device and home appliance
              repair services. Connecting you with verified technicians for
              reliable solutions.
            </p>

            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {/* Facebook Icon */}
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-500/40 transition shadow-2xs"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              {/* X / Twitter Icon */}
              <a
                href="#twitter"
                aria-label="Twitter"
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-500/40 transition shadow-2xs"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Instagram Icon */}
              <a
                href="#instagram"
                aria-label="Instagram"
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-500/40 transition shadow-2xs"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* LinkedIn Icon */}
              <a
                href="#linkedin"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:border-sky-500/40 transition shadow-2xs"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links & Popular Categories Cards on Mobile */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 sm:gap-8">
            {/* Quick Links Card */}
            <div className="rounded-2xl sm:rounded-none bg-slate-50/90 dark:bg-slate-950/40 sm:bg-transparent sm:dark:bg-transparent p-4 sm:p-0 border border-slate-200/80 dark:border-slate-800/80 sm:border-0">
              <h3 className="text-slate-900 dark:text-white font-semibold text-sm sm:text-lg mb-3 sm:mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 transition"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-sky-500/70 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-150 hidden sm:inline" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Categories Card */}
            <div className="rounded-2xl sm:rounded-none bg-slate-50/90 dark:bg-slate-950/40 sm:bg-transparent sm:dark:bg-transparent p-4 sm:p-0 border border-slate-200/80 dark:border-slate-800/80 sm:border-0">
              <h3 className="text-slate-900 dark:text-white font-semibold text-sm sm:text-lg mb-3 sm:mb-4">
                Popular Categories
              </h3>
              <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                {popularCategories.map((category) => (
                  <li key={category.href}>
                    <Link
                      href={category.href}
                      className="group inline-flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 transition"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-sky-500/70 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-150 hidden sm:inline" />
                      <span>{category.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Information */}
          <div className="lg:col-span-3 rounded-2xl sm:rounded-none bg-slate-50/90 dark:bg-slate-950/40 sm:bg-transparent sm:dark:bg-transparent p-5 sm:p-0 border border-slate-200/80 dark:border-slate-800/80 sm:border-0">
            <h3 className="text-slate-900 dark:text-white font-semibold text-base sm:text-lg mb-3.5 sm:mb-4">
              Contact Info
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm">
              <li className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </span>
                <span className="leading-relaxed">
                  123 Tech Street, Digital Avenue, Dhaka, Bangladesh
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </span>
                <a
                  href="tel:+880123456789"
                  className="hover:text-sky-600 dark:hover:text-sky-400 transition font-medium"
                >
                  +880 123 456 789
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </span>
                <a
                  href="mailto:support@fixmate.com"
                  className="hover:text-sky-600 dark:hover:text-sky-400 transition font-medium break-all"
                >
                  support@fixmate.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 sm:pt-8 mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-500">
          <p className="text-center sm:text-left">
            © 2026 FixMate. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href="#privacy"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              Terms of Service
            </a>
            <a
              href="#cookies"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}