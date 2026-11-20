export const getDashboardPath = (role) => {
  const normalized = (role || "customer").toString().toLowerCase().trim();
  if (normalized === "admin") return "/dashboard/admin";
  if (normalized === "technician") return "/dashboard/technician";
  return "/dashboard/customer";
};

export const getStoredToken = () => {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  } catch {
    return "";
  }
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return {
      ...parsed,
      role: (parsed.role || "customer").toString().toLowerCase().trim(),
    };
  } catch {
    try {
      localStorage.removeItem("user");
    } catch {
      // Ignore storage cleanup errors
    }
    return null;
  }
};

export const setAuthSession = ({ token, user }) => {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem("token", token);
    }
    if (user && typeof user === "object") {
      const normalizedUser = {
        ...user,
        role: (user.role || "customer").toString().toLowerCase().trim(),
      };
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    }
    window.dispatchEvent(new Event("auth-change"));
  } catch {
    // Ignore storage write errors
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
  } catch {
    // Ignore storage remove errors
  }
};