"use client";

import { useEffect } from "react";

// Strips the site-wide grid/glow background while this page is mounted,
// so the pirate stage can sit on plain black.
export default function PirateMode() {
  useEffect(() => {
    document.body.classList.add("pirate-mode");
    return () => {
      document.body.classList.remove("pirate-mode");
    };
  }, []);

  return null;
}
