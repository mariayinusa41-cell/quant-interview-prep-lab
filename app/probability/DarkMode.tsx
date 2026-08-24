"use client";

import { useEffect } from "react";

// Strips the site-wide grid/glow background while this page is mounted, so
// the page sits on plain black — same "arcade" look used across Brain
// Teasers (see app/brain-teasers/DarkMode.tsx, duplicated here rather than
// shared since this is a sibling top-level section, not a child of it).
export default function DarkMode() {
  useEffect(() => {
    document.body.classList.add("pirate-mode");
    return () => {
      document.body.classList.remove("pirate-mode");
    };
  }, []);

  return null;
}
