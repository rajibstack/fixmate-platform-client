"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { FixMateSpinner } from "@/components/ui/LoadingState";

const DEFAULT_TOPICS = [
  "General Inquiry",
  "Repair Booking Help",
  "Technician Onboarding",
  "Billing & Payment",
  "Other",
];

export default function ContactMessageFormSection({
  topics = DEFAULT_TOPICS,
  className = "",
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: topics[0] || "General Inquiry",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
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
      !formData.phone.trim() ||
      !formData.message.trim()
    ) {
      const msg =
        "Please fill in your name, email address, contact number, and message.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    const cleanedPhone = formData.phone.replace(/[\s()-]/g, "");
    if (!/^\+?\d{7,15}$/.test(cleanedPhone)) {
      const msg = "Please enter a valid contact number.";
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
          phone: formData.phone.trim(),
          contactNumber: formData.phone.trim(),
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
        phone: "",
        topic: topics[0] || "General Inquiry",
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

  return (
    <div
      className={`bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md dark:shadow-xl ${className}`}
    >
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Send a message
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Share your details and we will route your request to the right team.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2"
              >
                Contact number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+880 1XXX-XXXXXX"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:outline-none px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition"
              />
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
              rows={3}
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
  );
}