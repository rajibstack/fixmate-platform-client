"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Moon, Sun } from "lucide-react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "fixmate_theme";

function readInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return "light";
  } catch {
    return "light";
  }
}

function applyThemeToDom(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");

  useEffect(() => {
    const initial = readInitialTheme();
    setThemeState(initial);
    applyThemeToDom(initial);

    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleSystemChange = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") return;
      } catch {}
      setThemeState("light");
      applyThemeToDom("light");
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const setTheme = useCallback((nextTheme) => {
    const normalized = nextTheme === "dark" ? "dark" : "light";
    setThemeState(normalized);
    applyThemeToDom(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [setTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer ${
        isDark
          ? "bg-slate-900 text-amber-300 border-slate-700 hover:border-amber-400/50 hover:bg-slate-800"
          : "bg-white text-slate-800 border-slate-300 hover:border-sky-500 hover:bg-slate-50 shadow-sm"
      } ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-slate-700" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}