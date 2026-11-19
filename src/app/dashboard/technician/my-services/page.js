"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Wrench,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { DashboardPageSkeleton, FixMateSpinner } from "@/components/ui/LoadingState";

const CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "Home Appliances",
  "AC & Refrigeration",
  "Electrical",
  "Plumbing",
  "TV & Electronics",
  "Other",
];

const SERVICE_MODES = [
  "Home Visit",
  "Workshop Drop-off",
  "Pickup & Delivery",
];

function getReviewBadgeStyle(status) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "approved") {
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/25";
  }
  if (normalized === "rejected") {
    return "bg-rose-500/10 text-rose-300 border-rose-500/25";
  }
  return "bg-amber-500/10 text-amber-300 border-amber-500/25";
}

function formatReviewLabel(status) {
  const normalized = (status || "pending").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function MyServicesPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "Smartphone",
    mode: "Home Visit",
    price: "",
    duration: "",
    area: "",
    description: "",
    image: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMyServices = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      const res = await fetch(`${apiUrl}/api/technician/services`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load your services.");
      }

      const list = Array.isArray(data?.data) ? data.data : [];
      const filtered = parsedUser?.email
        ? list.filter(
            (item) =>
              !item.technicianEmail ||
              item.technicianEmail.toLowerCase() ===
                parsedUser.email.toLowerCase()
          )
        : list;

      setServices(filtered);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not fetch services.",
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchMyServices();
  }, [fetchMyServices]);

  const handleToggleAvailable = async (service) => {
    const id = service._id || service.id;
    const nextAvailable = !(service.available ?? true);

    setTogglingId(id);
    setFeedback(null);

    setServices((prev) =>
      prev.map((item) =>
        (item._id || item.id) === id
          ? { ...item, available: nextAvailable }
          : item
      )
    );

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/technician/services/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ available: nextAvailable }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update availability.");
      }
    } catch (err) {
      setServices((prev) =>
        prev.map((item) =>
          (item._id || item.id) === id
            ? { ...item, available: !nextAvailable }
            : item
        )
      );
      setFeedback({
        type: "error",
        message: err.message || "Could not update availability status.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const openEditModal = (service) => {
    setFeedback(null);
    setEditingService(service);
    setEditForm({
      title: service.title || "",
      category: service.category || "Smartphone",
      mode: service.mode || "Home Visit",
      price: service.price ?? "",
      duration: service.duration || "1-2 hours",
      area: service.area || "",
      description: service.description || "",
      image: service.image || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    const id = editingService._id || editingService.id;
    if (!editForm.title.trim() || Number(editForm.price) <= 0) {
      setFeedback({
        type: "error",
        message: "Title and a valid price greater than 0 are required.",
      });
      return;
    }

    setSavingEdit(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: editForm.title.trim(),
        category: editForm.category,
        mode: editForm.mode,
        price: Number(editForm.price),
        duration: editForm.duration.trim() || "1-2 hours",
        area: editForm.area.trim(),
        description: editForm.description.trim(),
        image: editForm.image.trim(),
      };

      const res = await fetch(`${apiUrl}/api/technician/services/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update service.");
      }

      const updatedDoc = data?.data || { ...editingService, ...payload };

      setServices((prev) =>
        prev.map((item) => ((item._id || item.id) === id ? updatedDoc : item))
      );
      setEditingService(null);
      setFeedback({
        type: "success",
        message: "Service updated successfully.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Error updating service.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteService = async (service) => {
    const id = service._id || service.id;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.title}"?`
    );
    if (!confirmed) return;

    setDeletingId(id);
    setFeedback(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/technician/services/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete service.");
      }

      setServices((prev) =>
        prev.filter((item) => (item._id || item.id) !== id)
      );
      setFeedback({
        type: "success",
        message: "Service removed from your listings.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Could not delete service.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || navigating) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800/90">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My services
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Edit, pause or remove your listings.
          </p>
        </div>

        <Link
          href="/dashboard/technician/add-service"
          onClick={() => setNavigating(true)}
          className="inline-flex items-center justify-center gap-2 self-start sm:self-auto bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add a service</span>
        </Link>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3.5 border flex items-start gap-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          )}
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {services.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">
              No services listed yet
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Create your first repair service listing to start receiving customer
              requests after admin approval.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/technician/add-service"
                onClick={() => setNavigating(true)}
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add a service</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/90 text-xs font-semibold text-slate-400 bg-slate-950/40">
                  <th className="py-4 px-5">Service</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Review</th>
                  <th className="py-4 px-4">Available</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {services.map((service) => {
                  const id = service._id || service.id;
                  const isAvailable = service.available ?? true;

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            {service.image ? (
                              <img
                                src={service.image}
                                alt={service.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Wrench className="w-4 h-4 text-sky-400" />
                            )}
                          </div>
                          <span className="font-semibold text-white">
                            {service.title}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                        {service.category}
                      </td>

                      <td className="py-4 px-4 text-sky-400 font-semibold whitespace-nowrap">
                        ${Number(service.price || 0)}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getReviewBadgeStyle(
                            service.status
                          )}`}
                        >
                          {formatReviewLabel(service.status)}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isAvailable}
                          aria-label={`Toggle availability for ${service.title}`}
                          disabled={togglingId === id}
                          onClick={() => handleToggleAvailable(service)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:opacity-60 ${
                            isAvailable
                              ? "bg-sky-500"
                              : "bg-slate-700 border border-slate-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                              isAvailable
                                ? "translate-x-6 bg-slate-950"
                                : "translate-x-1 bg-slate-300"
                            }`}
                          />
                        </button>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(service)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-sky-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === id}
                            onClick={() => handleDeleteService(service)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === id ? (
                              <FixMateSpinner compact />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {deletingId === id ? "Deleting..." : "Delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingService && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Edit service</h2>
              <button
                type="button"
                onClick={() => setEditingService(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-slate-200 mb-1.5">
                  Service title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-white outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-200 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-3.5 py-2.5 text-white outline-none transition cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-200 mb-1.5">
                    Service mode
                  </label>
                  <select
                    name="mode"
                    value={editForm.mode}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-3.5 py-2.5 text-white outline-none transition cursor-pointer"
                  >
                    {SERVICE_MODES.map((m) => (
                      <option key={m} value={m} className="bg-slate-900">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-200 mb-1.5">
                    Price (USD)
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={editForm.price}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-200 mb-1.5">
                    Estimated duration
                  </label>
                  <input
                    name="duration"
                    type="text"
                    value={editForm.duration}
                    onChange={handleEditChange}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-white outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-200 mb-1.5">
                  Service area
                </label>
                <input
                  name="area"
                  type="text"
                  value={editForm.area}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-white outline-none transition"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-200 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-2.5 text-white outline-none transition resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold disabled:opacity-60 transition shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  {savingEdit && <FixMateSpinner compact />}
                  <span>{savingEdit ? "Saving..." : "Save changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}