"use client";

import { useEffect } from "react";

// Green-felt table background for every game under /casino. Layered on top
// of pirate-mode (which strips the site-wide grid/glow) rather than
// replacing it, so the arcade chrome stays identical and only the surface
// under the table changes.
export default function CasinoMode() {
  useEffect(() => {
    document.body.classList.add("casino-mode");
    return () => {
      document.body.classList.remove("casino-mode");
    };
  }, []);

  return null;
}
