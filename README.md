<div align="center">

# 🛠️ FixMate Platform Client
### Frontend Web Application for On-Demand Device & Home Appliance Repair Platform

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

* **Project Name:** **FixMate Platform Client**
* **Purpose:** FixMate Platform Client is the Next.js (App Router) frontend web application for the **FixMate** on-demand device and home appliance repair service platform. It enables customers to explore services, inspect service details, technician profiles, ratings, and customer reviews with dynamic avatars, submit repair requests, track booking statuses, and download paid job invoices, while providing dedicated role-based dashboards for **Customer**, **Technician**, and **Admin** users.

---

## 🌐 Live URL

* **Frontend Live URL:** `https://your-fixmate-client-url.vercel.app` *(replace with your live deployment URL; local default: `http://localhost:3000`)*

---

## 🔐 Admin & Demo Credentials

Demo credentials for **Admin**, **Technician**, and **Customer** roles are pre-configured on the **Sign In** page (`/sign-in`) for quick role selection and testing.

* **Admin Account**
* **Demo Roles on Sign In Page:** Quick-fill demo credentials are configured on the client Sign In page for **Admin**, **Technician**, and **Customer** roles so reviewers and testers can sign in and explore each role's dashboard and workflows directly.

---

## ✨ Key Features

* **🌗 Light & Dark Theme Support:** Dynamic theme switching (`light` / `dark`) via `ThemeProvider` and `ThemeToggle`, persisted in `localStorage` (`fixmate_theme`) with `data-theme`, `color-scheme`, and system preference (`prefers-color-scheme`) support.
* **🛠️ Service Catalog, Details, Reviews & Booking:** Browse and filter services, view full service details, technician summaries, ratings, and customer reviews with dynamic avatars, and submit customer repair requests.
* **📊 Role-Based Dashboards:** Dedicated routes and overview components (`AdminOverview`, `TechnicianOverview`, `CustomerOverview`, `DashboardOverviewClient`) for managing bookings, services, users, transactions, contact messages, and user profiles.
* **🧭 Smart Layout & Route States:** `LayoutWrapper` automatically switches between public navigation (`Navbar` & `Footer`) and `/dashboard` layouts, complete with `error.jsx`, `not-found.jsx`, `loading.js`, and skeleton states (`LoadingState.jsx`).
* **🧾 Printable / PDF Paid Job Invoices:** Built-in `downloadPaidJobInvoice` utility (`generateInvoicePdf.js`) formatting paid bookings with invoice details, transaction IDs, service summaries, and print/PDF support.
* **🔔 Toast Notifications & Confirmations:** Global `Toaster` (`sonner`) alerts and reusable confirmation modals (`ConfirmModal.jsx`).

---

## 📦 NPM Packages Used

| Package | Purpose |
| :--- | :--- |
| `next` | React framework with App Router for routing, layouts, and page rendering |
| `react` & `react-dom` | Core UI library for building interactive components and pages |
| `tailwindcss` & `@tailwindcss/postcss` | Utility-first styling with Tailwind CSS v4 and custom dark/theme tokens |
| `lucide-react` | Icon set used across navigation, cards, forms, modals, and dashboards |
| `sonner` | Toast notification system (`Toaster` and `toast`) for user feedback |

---

## 📁 Frontend Folder Structure

```text
fixmate-platform-client/
├── public/
├── src/
│   ├── app/
│   │   ├── about/
│   │   │   └── page.js
│   │   ├── contact/
│   │   │   └── page.js
│   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   │   ├── bookings/page.js
│   │   │   │   ├── messages/page.js
│   │   │   │   ├── services/page.js
│   │   │   │   ├── transactions/page.js
│   │   │   │   ├── users/page.js
│   │   │   │   └── page.js
│   │   │   ├── customer/
│   │   │   │   ├── bookings/page.js
│   │   │   │   ├── payments/page.js
│   │   │   │   └── page.js
│   │   │   ├── overview/page.js
│   │   │   ├── profile/page.js
│   │   │   ├── technician/
│   │   │   │   ├── add-service/page.js
│   │   │   │   ├── my-services/page.js
│   │   │   │   └── requests/page.js
│   │   │   ├── layout.js
│   │   │   ├── loading.js
│   │   │   └── page.js
│   │   ├── services/
│   │   │   ├── [id]/page.js
│   │   │   └── page.js
│   │   ├── sign-in/page.js
│   │   ├── sign-up/page.js
│   │   ├── error.jsx
│   │   ├── globals.css
│   │   ├── layout.js
│   │   ├── loading.js
│   │   ├── not-found.jsx
│   │   └── page.js
│   ├── components/
│   │   ├── about/
│   │   │   ├── AboutHeroSection.jsx
│   │   │   ├── AboutHighlightsSection.jsx
│   │   │   ├── AboutTrustCtaSection.jsx
│   │   │   └── HowFixMateWorksSection.jsx
│   │   ├── contact/
│   │   │   ├── ContactHeaderSection.jsx
│   │   │   ├── ContactInfoCardsSection.jsx
│   │   │   ├── ContactMessageFormSection.jsx
│   │   │   └── ContactSidebarSection.jsx
│   │   ├── home/
│   │   │   ├── CustomerReviewsSection.jsx
│   │   │   ├── FeaturedServicesSection.jsx
│   │   │   ├── HomeHeroSection.jsx
│   │   │   ├── HowFixMateWorksHomeSection.jsx
│   │   │   └── PopularCategoriesTrustSection.jsx
│   │   ├── overviews/
│   │   │   ├── AdminOverview.jsx
│   │   │   ├── CustomerOverview.jsx
│   │   │   ├── DashboardOverviewClient.jsx
│   │   │   └── TechnicianOverview.jsx
│   │   ├── services/
│   │   │   ├── BrowseServicesSection.jsx
│   │   │   └── ChooseHowYouUseSection.jsx
│   │   ├── ui/
│   │   │   ├── ConfirmModal.jsx
│   │   │   └── LoadingState.jsx
│   │   ├── Footer.jsx
│   │   ├── LayoutWrapper.jsx
│   │   ├── Navbar.jsx
│   │   └── ThemeProvider.jsx
│   └── utils/
│       ├── auth.js
│       └── generateInvoicePdf.js
├── .env
├── .gitignore
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package-lock.json
├── package.json
└── README.md