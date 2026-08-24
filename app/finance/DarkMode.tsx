"use client";

import { useEffect } from "react";

// Strips the site-wide grid/glow background while this page is mounted, same
// "arcade" look used across Brain Teasers / Probability — duplicated here
// rather than shared since Finance is a sibling top-level section.
export default function DarkMode() {
  useEffect(() => {
    document.body.classList.add("pirate-mode");
    return () => {
      document.body.classList.remove("pirate-mode");
    };
  }, []);

  return null;
}
