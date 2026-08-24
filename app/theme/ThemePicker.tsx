"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, useTheme } from "./ThemeProvider";
import { useSound } from "../audio/SoundProvider";

/** Palette switcher, pinned next to the HUD. */
export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const { playSfx } = useSound();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on an outside click or Escape, the way any menu should behave.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-picker" ref={ref}>
      <button
        type="button"
        className="theme-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Theme: ${active.label}`}
      >
        <span className="theme-swatch" aria-hidden="true">
          {active.swatch.map((c) => <i key={c} style={{ background: c }} />)}
        </span>
        <span className="sr-only">Change theme (current: {active.label})</span>
      </button>

      {open && (
        <div className="theme-menu" role="menu" aria-label="Themes">
          <p className="theme-menu-title">Theme</p>
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.id}
              role="menuitemradio"
              aria-checked={t.id === theme}
              className={t.id === theme ? "theme-option is-on" : "theme-option"}
              onClick={() => { setTheme(t.id); playSfx("select"); setOpen(false); }}
            >
              <span className="theme-swatch" aria-hidden="true">
                {t.swatch.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <span className="theme-option-body">
                <strong>{t.label}</strong>
                <span>{t.blurb}</span>
              </span>
              {t.id === theme && <span className="theme-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
