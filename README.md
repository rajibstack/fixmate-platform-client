<div align="center">

# 🛠️ FixMate
### On-Demand Device & Home Appliance Repair Service Platform

<p align="center">
  <strong>Full-Stack Client & Server Platform with Role-Based Dashboards, Booking Workflows, Paid Job Invoices & Light/Dark Theme</strong>
</p>

<p align="center">
  <a href="#-about-fixmate">About</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-environment-variables">Environment</a> •
  <a href="#-api-endpoints">API Endpoints</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-App%20Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Theme-Light%20%7C%20Dark-0EA5E9?style=for-the-badge" alt="Light & Dark Theme" />
</p>

</div>

---

## 📖 About FixMate

**FixMate** is a full-stack repair service platform built to connect customers with technicians for on-demand device and home appliance repairs. The project consists of a **Client** web application built with Next.js (App Router) and Tailwind CSS v4, paired with a **Server** backend API powered by Node.js, Express, and MongoDB.

---

## ✨ Key Features

* **🌗 Light & Dark Theme Support:** Dynamic theme switching (`light` / `dark`) using `ThemeProvider` and `ThemeToggle`, persisted in `localStorage` (`fixmate_theme`) with `data-theme`, `color-scheme`, and system preference (`prefers-color-scheme`) support.
* **🔐 Session & Role Management:** Client-side auth session helpers (`getStoredToken`, `getStoredUser`, `setAuthSession`, `clearAuthSession`) and role-based dashboard routing (`getDashboardPath`) for **Customer**, **Technician**, and **Admin** roles.
* **🧭 Smart Layout Switching:** `LayoutWrapper` automatically renders public navigation (`Navbar` & `Footer`) for public routes and a dedicated layout container for `/dashboard` routes, wrapped with `Suspense` and skeleton fallbacks.
* **🧾 Printable / PDF Paid Job Invoices:** Built-in `downloadPaidJobInvoice` utility (`generateInvoicePdf.js`) that formats paid bookings with invoice number, transaction ID, billing/technician details, service summary, and print/PDF support.
* **🔔 Toast Notifications & UI States:** Global `Toaster` (`sonner`) notifications, custom error and not-found boundaries, and skeleton loading states.
* **⚙️ RESTful Server API:** Modular backend architecture for authentication, repair services, bookings, role workflows, and payments.

---

## 📁 Project Structure

```text
fixmate/
├── client/                              # Next.js (App Router) Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js                # Root layout, fonts, theme init script, Toaster & LayoutWrapper
│   │   │   ├── globals.css              # Tailwind v4 import, @custom-variant dark & @theme inline
│   │   │   └── dashboard/               # Role-based dashboards (admin, technician, customer)
│   │   ├── components/
│   │   │   ├── ThemeProvider.jsx        # Theme context, persistence & ThemeToggle button
│   │   │   ├── LayoutWrapper.jsx        # Public vs. dashboard layout switcher
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ui/
│   │   │       └── LoadingState.jsx     # PublicPageSkeleton & loading components
│   │   └── utils/
│   │       ├── auth.js                  # Token, user storage & role path helpers
│   │       └── generateInvoicePdf.js    # Paid job invoice generator
│   └── package.json
│
└── server/                              # Node.js + Express + MongoDB Backend
    ├── src/
    │   ├── config/                      # Database & environment setup
    │   ├── controllers/                 # Route controllers & business logic
    │   ├── middleware/                  # Auth, error handling & CORS middleware
    │   ├── models/                      # MongoDB / Mongoose models
    │   └── routes/                      # API route modules
    └── package.json