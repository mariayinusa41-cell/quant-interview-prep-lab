"use client";

import { useEffect } from "react";

// Strips the site-wide grid/glow background while this page is mounted, so
// the page can sit on plain black — the shared "arcade" look for the Brain
// Teasers section and every game built inside it (not just Screwy Pirates,
// hence the generic name — see also screwy-pirates/PirateMode.tsx, which
// does the same thing under a puzzle-specific name for that page tree).
export default function DarkMode() {
  useEffect(() => {
    document.body.classList.add("pirate-mode");
    return () => {
      document.body.classList.remove("pirate-mode");
    };
  }, []);

  return null;
}
