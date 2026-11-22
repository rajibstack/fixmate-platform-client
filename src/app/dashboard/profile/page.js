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
import {
  DashboardPageSkeleton,
  FixMateSpinner,
} from "@/components/ui/LoadingState";

function formatRoleLabel(role) {
  const normalized = (role || "customer").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getAuthToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function extractUpdatedUser(responseData) {
  if (!responseData || typeof responseData !== "object") return {};
  if (responseData.user && typeof responseData.user === "object") {
    return responseData.user;
  }
  if (responseData.data && typeof responseData.data === "object") {
    return responseData.data.user || responseData.data;
  }
  return {};
}

export default function UpdateProfilePage() {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");
  const imgbbKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "customer",
    plan: "free",
    isVerifiedPro: false,
    area: "",
    bio: "",
    avatar: "",
  });

  const [photoPreview, setPhotoPreview] = useState("");
  const [imgFailed, setImgFailed] = useState(false);
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
          role: parsed?.role || "customer",
          plan: parsed?.plan || "free",
          isVerifiedPro: Boolean(parsed?.isVerifiedPro || parsed?.plan === "pro"),
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

    const token = getAuthToken();
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
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return;
        const meUser = extractUpdatedUser(data);
        if (meUser && Object.keys(meUser).length > 0) {
          const nextAvatar =
            meUser.avatar !== undefined ? meUser.avatar : "";
          const nextPlan = meUser.plan || "free";
          const nextIsPro = Boolean(
            meUser.isVerifiedPro || String(nextPlan).toLowerCase() === "pro"
          );

          setFormData((prev) => ({
            ...prev,
            name: meUser.name ?? prev.name,
            phone: meUser.phone ?? prev.phone,
            email: meUser.email ?? prev.email,
            role: meUser.role ?? prev.role,
            plan: nextPlan,
            isVerifiedPro: nextIsPro,
            area: meUser.area ?? prev.area,
            bio: meUser.bio ?? prev.bio,
            avatar: nextAvatar,
          }));
          setPhotoPreview(nextAvatar);
          setImgFailed(false);

          try {
            const existingRaw = localStorage.getItem("user");
            const existingObj = existingRaw ? JSON.parse(existingRaw) : {};
            const syncedUser = {
              ...existingObj,
              ...meUser,
              avatar: nextAvatar,
              plan: nextPlan,
              isVerifiedPro: nextIsPro,
            };
            localStorage.setItem("user", JSON.stringify(syncedUser));
            window.dispatchEvent(new Event("auth-change"));
          } catch {
            // ignore storage write error
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
    e.target.value = "";
    if (!file) return;

    setFeedback(null);
    setImgFailed(false);

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
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
    setImgFailed(false);
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
      const token = getAuthToken();
      if (!token) {
        throw new Error("Please sign in to update your profile.");
      }

      const res = await fetch(`${apiUrl}/api/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update profile.");
      }

      const serverUser = extractUpdatedUser(data);
      const existingStored = localStorage.getItem("user");
      let parsedStored = {};
      try {
        parsedStored = existingStored ? JSON.parse(existingStored) : {};
      } catch {
        parsedStored = {};
      }

      const mergedUser = {
        ...parsedStored,
        ...serverUser,
        ...payload,
      };

      localStorage.setItem("user", JSON.stringify(mergedUser));
      setFormData((prev) => ({
        ...prev,
        name: mergedUser.name ?? prev.name,
        phone: mergedUser.phone ?? prev.phone,
        email: mergedUser.email ?? prev.email,
        role: mergedUser.role ?? prev.role,
        plan: mergedUser.plan ?? prev.plan,
        isVerifiedPro: Boolean(
          mergedUser.isVerifiedPro || mergedUser.plan === "pro"
        ),
        area: mergedUser.area ?? prev.area,
        bio: mergedUser.bio ?? prev.bio,
        avatar: mergedUser.avatar ?? "",
      }));
      setPhotoPreview(mergedUser.avatar || "");
      setImgFailed(false);

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

  const displayAvatar = !imgFailed ? formData.avatar || photoPreview : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div className="pb-5 border-b border-slate-200 dark:border-slate-800/90">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Update profile
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1.5">
          Your name and photo show in the navbar and on your services.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3.5 border flex items-start gap-3 text-sm ${
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
          <div className="flex-1">
            <p className="font-medium">{feedback.message}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-md dark:shadow-xl space-y-6"
      >
        {/* Photo Upload Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="relative w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
            {displayAvatar ? (
              <>
                <img
                  src={displayAvatar}
                  alt={formData.name || "Profile photo"}
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  aria-label="Remove photo"
                  className="absolute inset-0 bg-black/65 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-center px-1.5 text-slate-400 dark:text-slate-500">
                <UserIcon className="w-5 h-5 mb-0.5 text-slate-400 dark:text-slate-600" />
                <span className="text-[10px] leading-tight">No image yet</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white transition cursor-pointer">
              {uploadingPhoto ? (
                <FixMateSpinner compact />
              ) : (
                <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
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
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uploaded through the ImgBB step (simulated). JPG or PNG, up to 8 MB.
            </p>
          </div>
        </div>

        {/* Full name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
            >
              Full name{" "}
              <span className="text-sky-600 dark:text-sky-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
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
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
            />
          </div>
        </div>

        {/* Locked Email & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
          <div>
            <label
              htmlFor="email"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              <span>Email</span>
              <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </label>
            <input
              id="email"
              name="email"
              type="email"
              readOnly
              aria-readonly="true"
              value={formData.email}
              className="w-full rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/90 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed select-none"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Role
            </span>
            <div className="h-[46px] flex items-center gap-2">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25">
                {formatRoleLabel(formData.role)}
              </span>
              {formData.role === "technician" && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    formData.isVerifiedPro
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/35"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {formData.isVerifiedPro ? "Verified Pro" : "Free"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Area */}
        <div>
          <label
            htmlFor="area"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
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
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-slate-800 dark:text-slate-200 mb-2"
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
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition resize-y"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
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