"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { FixMateSpinner, PublicPageSkeleton } from "@/components/ui/LoadingState";

const contactMethods = [
  {
    label: "Support Email",
    value: "support@fixmate.com",
    note: "We typically reply within a few hours",
    icon: Mail,
    accent: "text-sky-600 dark:text-sky-400",
    href: "mailto:support@fixmate.com",
  },
  {
    label: "Phone & Hotline",
    value: "+880 123 456 789",
    note: "Direct help for urgent repair requests",
    icon: Phone,
    accent: "text-emerald-600 dark:text-emerald-400",
    href: "tel:+880123456789",
  },
  {
    label: "Service Hours",
    value: "Sat – Thu, 9 AM – 9 PM",
    note: "Technician dispatch & customer support",
    icon: Clock,
    accent: "text-amber-600 dark:text-amber-300",
    href: null,
  },
  {
    label: "Location",
    value: "123 Tech Street, Digital Avenue",
    note: "Device & home appliance repair network",
    icon: MapPin,
    accent: "text-indigo-600 dark:text-indigo-300",
    href: null,
  },
];

const topics = [
  "General Inquiry",
  "Repair Booking Help",
  "Technician Onboarding",
  "Billing & Payment",
  "Other",
];

const quickNotes = [
  "Include your ticket code (e.g. #FM-1024) if asking about an active repair.",
  "Want to list your repair services? Sign up or sign in with a technician account.",
  "For payment status or invoice questions, check your dashboard payment records first.",
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "General Inquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      const msg = "Please fill in your name, email address, and message.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    if (formData.message.trim().length < 15) {
      const msg =
        "Please write at least 15 characters so we can assist you properly.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          topic: formData.topic,
          message: formData.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Could not send your message.");
      }

      const successMsg =
        "Thanks for reaching out! Your message has been saved and our team will get back to you shortly.";
      setFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success("Message sent! Our team will get back to you shortly.");
      setFormData({
        name: "",
        email: "",
        topic: "General Inquiry",
        message: "",
      });
    } catch (err) {
      const errMsg = err.message || "Something went wrong. Please try again.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (navigating) {
    return <PublicPageSkeleton cards={4} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 sm:space-y-12">
        {/* Header */}
        <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold">
              <MessageSquare className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Contact Us</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Get in touch with{" "}
              <span className="text-sky-600 dark:text-sky-400">
                FixMate support
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Have a question about a device or home appliance repair, need help
              with an existing booking, or want to join as a technician? Send us
              a message below.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {contactMethods.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/90 rounded-2xl p-6 flex flex-col justify-between shadow-md dark:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {item.label}
                  </span>
                  <Icon className={`w-4 h-4 ${item.accent}`} />
                </div>

                <div className="mt-4">
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition break-words"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
                      {item.value}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Form + Side Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md dark:shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Send a message
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Share your details and we will route your request to the right
                team.
              </p>
            </div>

            {feedback && (
              <div
                className={`mb-6 rounded-2xl px-4 py-3.5 border flex items-start gap-3 text-sm ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                )}
                <p className="font-medium flex-1">{feedback.message}</p>
              </div>
            )}

            {submitting ? (
              <div className="rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4">
                <FixMateSpinner label="Sending your message..." compact />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:outline-none px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:outline-none px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="topic"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Topic
                  </label>
                  <select
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:outline-none px-4 py-3 text-sm text-slate-900 dark:text-white transition"
                  >
                    {topics.map((topic) => (
                      <option
                        key={topic}
                        value={topic}
                        className="bg-white dark:bg-slate-950"
                      >
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your question, booking ID, or device issue..."
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:outline-none px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>Send message</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Helpful Notes & Shortcuts */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Helpful tips before writing
                </h2>
              </div>

              <ul className="space-y-3">
                {quickNotes.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 mt-2 shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-sky-500/15 via-white to-slate-100 dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-7 shadow-md dark:shadow-xl dark:shadow-sky-500/5 space-y-4">
              <div className="flex items-center gap-2.5">
                <Wrench className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Need a repair right away?
                </h2>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-300/90 leading-relaxed">
                Browse approved technicians and book a repair slot directly, or
                open your dashboard to track an active job.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/services"
                  onClick={() => setNavigating(true)}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold transition shadow-md shadow-sky-500/20"
                >
                  Browse services
                </Link>
                <Link
                  href="/sign-in"
                  onClick={() => setNavigating(true)}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-950/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold transition"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}