<div align="center">

# 🛠️ FixMate Client
### On-Demand Device & Home Appliance Repair Service Platform (Frontend)

<p align="center">
  <strong>Next.js (App Router) • Tailwind CSS v4 • Lucide Icons • Sonner • Role-Based Dashboards & Invoices</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-App%20Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/UI-Light%20%7C%20Dark%20Theme-0EA5E9?style=for-the-badge" alt="Light & Dark Theme" />
  <img src="https://img.shields.io/badge/Notifications-Sonner-111827?style=for-the-badge" alt="Sonner" />
</p>

</div>

---

## 📌 Project Name & Purpose

* **Project Name:** **FixMate Client**
* **Purpose:** FixMate Client is the frontend web application for the **FixMate** on-demand device and home appliance repair service platform. Built with Next.js (App Router) and Tailwind CSS v4, it lets customers browse and filter repair services, view service details, technician profiles, ratings, and customer reviews, submit booking requests, track bookings, download paid job invoices, and access role-based dashboards for **Customer**, **Technician**, and **Admin** users[cite: 17].

---

## 🌐 Live URL

* **Frontend Live URL:** `https://your-fixmate-client-url.vercel.app` *(replace with your live deployment URL; local default: `http://localhost:3000`)*

---

## 🔑 Admin Credentials

> ⚠️ **Note:** Replace `<YOUR_ADMIN_PASSWORD>` with your actual configured password before publishing or sharing publicly.

* **Email:** `admin@fixmate.app`
* **Password:** `<YOUR_ADMIN_PASSWORD>`
* **Role:** `admin`

---

## ✨ Key Features

* **🌗 Light & Dark Theme Support:** Dynamic theme switching (`light` / `dark`) via `ThemeProvider` and `ThemeToggle`, persisted in `localStorage` (`fixmate_theme`) with `data-theme`, `color-scheme`, and system preference (`prefers-color-scheme`) support.
* **🛠️ Service Catalog, Details, Booking & Reviews:** Browse approved repair services, inspect full service details, technician summaries, ratings, and customer reviews with dynamic avatars, and submit repair requests for customers[cite: 17].
* **🔐 Session & Role Management:** Client-side auth helpers (`getStoredToken`, `getStoredUser`, `setAuthSession`, `clearAuthSession`) and role-based dashboard routing (`getDashboardPath`) for **Customer**, **Technician**, and **Admin** roles.
* **🧭 Smart Layout Switching:** `LayoutWrapper` automatically renders public navigation (`Navbar` & `Footer`) on public routes and a dedicated layout container on `/dashboard` routes with `Suspense` and skeleton fallbacks.
* **🧾 Printable / PDF Paid Job Invoices:** Built-in `downloadPaidJobInvoice` utility (`generateInvoicePdf.js`) formatting paid bookings with invoice number, transaction ID, billing/technician details, service summary, and print/PDF support.
* **🔔 Toast Notifications & UI States:** Global `Toaster` (`sonner`) notifications, custom error/not-found boundaries, and skeleton loading states[cite: 17].

---

## 📦 NPM Packages Used

| Package | Purpose |
| :--- | :--- |
| `next` | React framework with App Router for routing, layouts, and rendering |
| `react` & `react-dom` | Core UI library for building interactive components and pages |
| `tailwindcss` & `@tailwindcss/postcss` | Utility-first styling with Tailwind CSS v4 and custom dark/theme tokens |
| `lucide-react` | Clean SVG icon set used across navigation, cards, forms, and dashboards |
| `sonner` | Toast notification system (`Toaster` and `toast`) for feedback alerts[cite: 17] |

---

## 📁 Frontend Folder Structure

```text
client/
├── src/
│   ├── app/
│   │   ├── layout.js                # Root layout, fonts, theme init script, Toaster & LayoutWrapper
│   │   ├── globals.css              # Tailwind v4 import, @custom-variant dark & @theme inline
│   │   ├── services/                # Services listing & [id] service details pages
│   │   └── dashboard/               # Role-based dashboards (admin, technician, customer)
│   ├── components/
│   │   ├── ThemeProvider.jsx        # Theme context, persistence & ThemeToggle button
│   │   ├── LayoutWrapper.jsx        # Public vs. dashboard layout switcher
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   └── ui/
│   │       └── LoadingState.jsx     # PublicPageSkeleton & loading components
│   └── utils/
│       ├── auth.js                  # Token, user storage & role path helpers
│       └── generateInvoicePdf.js    # Paid job invoice generator
└── package.json