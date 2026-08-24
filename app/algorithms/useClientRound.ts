"use client";

import { useEffect, useState } from "react";

// Every sub-game's first round is procedurally generated with Math.random(),
// which runs once during SSR and again during client hydration — two
// different values for the same render, which React flags as a hydration
// mismatch. Generating the first round only after mount sidesteps that:
// server and client both render the `null` state identically, then the
// client fills in the real round. (Same helper as
// app/calculus-linear-algebra/useClientRound.ts — duplicated per-folder to
// match this codebase's existing convention, see e.g. the DarkMode.tsx
// components repeated across drills/probability/finance.)
export function useClientRound<T>(factory: () => T) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    setValue(factory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function next() {
    setValue(factory());
  }

  return [value, next] as const;
}
