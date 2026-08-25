"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeId = "midnight" | "crimson" | "matrix" | "amber" | "synthwave" | "paper" | "frost";

export const THEMES: { id: ThemeId; label: string; blurb: string; swatch: string[] }[] = [
  { id: "midnight",  label: "Midnight",  blurb: "The default cabinet - blue and gold.", swatch: ["#05070a", "#4fb3e0", "#f4c542"] },
  { id: "crimson",   label: "Crimson",   blurb: "Red alert. Everything is a margin call.", swatch: ["#0b0405", "#ff7b6b", "#ffb43c"] },
  { id: "matrix",    label: "Matrix",    blurb: "Green phosphor terminal.",               swatch: ["#030805", "#4dff9f", "#b8ff5c"] },
  { id: "amber",     label: "Amber",     blurb: "Monochrome amber CRT.",                  swatch: ["#0a0703", "#ffcf7a", "#ffb347"] },
  { id: "synthwave", label: "Synthwave", blurb: "Magenta and cyan, 1984.",                swatch: ["#0c0618", "#ff5fd2", "#4de2ff"] },
  { id: "paper",     label: "Paper",     blurb: "Warm light mode - cream and sepia.",       swatch: ["#f2eee6", "#1f6fb2", "#8a5c06"] },
  { id: "frost",     label: "Frost",      blurb: "Cool light mode, high contrast.",          swatch: ["#f8fafc", "#1259a8", "#92510a"] },
];

const THEME_KEY = "quant_theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("midnight");
  // Without this guard the write-effect below fires on mount with the default
  // theme and clobbers whatever was saved, so the choice never survives a
  // reload.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) setThemeState(saved);
    } catch {
      /* storage unavailable — stay on the default */
    } finally {
      setHydrated(true);
    }
  }, []);

  // The attribute goes on <html> so it also covers anything rendered outside
  // the React root, and midnight carries no attribute since it IS :root.
  useEffect(() => {
    if (!hydrated) return;
    const el = document.documentElement;
    if (theme === "midnight") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* noop */
    }
  }, [theme, hydrated]);

  const value = useMemo(() => ({ theme, setTheme: setThemeState }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context ?? { theme: "midnight" as ThemeId, setTheme: () => {} };
}
