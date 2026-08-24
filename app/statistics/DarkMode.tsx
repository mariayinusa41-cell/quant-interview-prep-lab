"use client";

import { useEffect } from "react";

// Strips the site-wide grid/glow background while mounted — same arcade look
// used across the other top-level labs.
export default function DarkMode() {
  useEffect(() => {
    document.body.classList.add("pirate-mode");
    return () => {
      document.body.classList.remove("pirate-mode");
    };
  }, []);

  return null;
}
