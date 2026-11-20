"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardPageSkeleton, FixMateSpinner } from "@/components/ui/LoadingState";

function formatRoleLabel(role) {
  const normalized = (role || "technician").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function UpdateProfilePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const imgbbKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "technician",
    area: "",
    bio: "",
    avatar: "",
  });

  const [photoPreview, setPhotoPreview] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    let hasCachedUser = false;

    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        hasCachedUser = Boolean(parsed && typeof parsed === "object");
        setFormData((prev) => ({
          ...prev,
          name: parsed?.name || "",
          phone: parsed?.phone || "",
          email: parsed?.email || "",
          role: parsed?.role || "technician",
          area: parsed?.area || "",
          bio: parsed?.bio || "",
          avatar: parsed?.avatar || "",
        }));
        if (parsed?.avatar) {
          setPhotoPreview(parsed.avatar);
        }
      }
    } catch {
      // ignore storage parse error
    }

    const token = localStorage.getItem("token");
    if (!token) {
      if (active) setLoadingProfile(false);
      return () => {
        active = false;
      };
    }

    if (hasCachedUser && active) {
      setLoadingProfile(false);
    }

    fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.success && data?.user) {
          setFormData((prev) => ({
            ...prev,
            name: data.user.name || prev.name,
            phone: data.user.phone || prev.phone,
            email: data.user.email || prev.email,
            role: data.user.role || prev.role,
            area: data.user.area || prev.area,
            bio: data.user.bio || prev.bio,
            avatar: data.user.avatar || prev.avatar,
          }));
          if (data.user.avatar) {
            setPhotoPreview(data.user.avatar);
          }
        }
      })
      .catch(() => {
        // fallback to localStorage data
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [apiUrl]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const compressImageToDataUrl = (file, maxWidth = 512, quality = 0.75) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      };
      img.src = objectUrl;
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (feedback) setFeedback(null);
  };

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFeedback(null);

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      const msg = "Please select a valid JPG, PNG, or WEBP image.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const msg = "Photo size must be 8 MB or smaller.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(localPreviewUrl);

    if (!imgbbKey) {
      try {
        const compressed = await compressImageToDataUrl(file);
        setFormData((prev) => ({ ...prev, avatar: compressed }));
      } catch {
        const msg = "Could not process the selected photo.";
        setFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      }
      return;
    }

    try {
      setUploadingPhoto(true);
      const body = new FormData();
      body.append("image", file);

      const res = await fetch(
        `https://api.imgbb.com/1/upload?key=${encodeURIComponent(imgbbKey)}`,
        { method: "POST", body }
      );
      const data = await res.json();

      if (res.ok && data?.success && data?.data?.display_url) {
        setFormData((prev) => ({ ...prev, avatar: data.data.display_url }));
      } else {
        const compressed = await compressImageToDataUrl(file);
        setFormData((prev) => ({ ...prev, avatar: compressed }));
      }
    } catch {
      const compressed = await compressImageToDataUrl(file);
      setFormData((prev) => ({ ...prev, avatar: compressed }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview && photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview("");
    setFormData((prev) => ({ ...prev, avatar: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.name.trim()) {
      const msg = "Full name is required.";
      setFeedback({ type: "error", message: msg });
      toast.error(msg);
      return;
    }

    if (uploadingPhoto) {
      const msg = "Please wait until the photo finishes uploading.";
      setFeedback({
        type: "error",
        message: msg,
      });
      toast.error(msg);
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      area: formData.area.trim(),
      bio: formData.bio.trim(),
      avatar: formData.avatar || "",
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiUrl}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update profile.");
      }

      const existingStored = localStorage.getItem("user");
      const parsedStored = existingStored ? JSON.parse(existingStored) : {};
      const mergedUser = {
        ...parsedStored,
        ...(data?.user || {}),
        ...payload,
      };
      localStorage.setItem("user", JSON.stringify(mergedUser));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("auth-change"));

      const successMsg = "Profile updated successfully.";
      setFeedback({
        type: "success",
        message: successMsg,
      });
      toast.success(successMsg);
    } catch (err) {
      const errMsg = err.message || "Something went wrong while saving profile.";
      setFeedback({
        type: "error",
        message: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return <DashboardPageSkeleton />;
  }

  const displayAvatar = formData.avatar || photoPreview;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="pb-5 border-b border-slate-800/90">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Update profile
        </h1>
        <p className="text-slate-400 text-sm mt-1.5">
          Your name and photo show in the navbar and on your services.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl space-y-6"
      >
        {/* Photo Upload Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-800/80">
          <div className="relative w-20 h-20 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {displayAvatar ? (
              <>
                <img
                  src={displayAvatar}
                  alt={formData.name || "Profile photo"}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  aria-label="Remove photo"
                  className="absolute inset-0 bg-slate-950/65 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-center px-1.5 text-slate-500">
                <UserIcon className="w-5 h-5 mb-0.5 text-slate-600" />
                <span className="text-[10px] leading-tight">No image yet</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-white transition cursor-pointer">
              {uploadingPhoto ? (
                <FixMateSpinner compact />
              ) : (
                <Upload className="w-4 h-4 text-sky-400" />
              )}
              <span>{uploadingPhoto ? "Uploading..." : "Upload photo"}</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoFile}
                disabled={uploadingPhoto || saving}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-400">
              Uploaded through the ImgBB step (simulated). JPG or PNG, up to 8 MB.
            </p>
          </div>
        </div>

        {/* Full name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-200 mb-2"
            >
              Full name <span className="text-sky-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-200 mb-2"
            >
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01812-445566"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition"
            />
          </div>
        </div>

        {/* Locked Email & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
          <div>
            <label
              htmlFor="email"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2"
            >
              <span>Email</span>
              <Lock className="w-3.5 h-3.5 text-slate-500" />
            </label>
            <input
              id="email"
              name="email"
              type="email"
              readOnly
              aria-readonly="true"
              value={formData.email}
              className="w-full rounded-xl bg-slate-950/60 border border-slate-800/90 px-4 py-3 text-sm text-slate-400 outline-none cursor-not-allowed select-none"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-300 mb-2">
              Role
            </span>
            <div className="h-[46px] flex items-center">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/25">
                {formatRoleLabel(formData.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Area */}
        <div>
          <label
            htmlFor="area"
            className="block text-sm font-medium text-slate-200 mb-2"
          >
            Area
          </label>
          <input
            id="area"
            name="area"
            type="text"
            value={formData.area}
            onChange={handleChange}
            placeholder="Mirpur, Dhaka"
            className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-slate-200 mb-2"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            placeholder="Share your repair experience, specialties, and warranty details..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition resize-y"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            Customers read this on your service pages.
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving || uploadingPhoto}
            className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-sky-500/20 cursor-pointer"
          >
            {saving ? (
              <FixMateSpinner compact />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Saving..." : "Save profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}