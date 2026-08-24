"use client";

import { useEffect, useState } from "react";

// Every sub-game's first round is procedurally generated with Math.random(),
// which runs once during SSR and again during client hydration — two
// different values for the same render, which React flags as a hydration
// mismatch (and, worse, can visibly show the server's random pick for a
// frame before silently discarding it). Generating the first round only
// after mount sidesteps that: server and client both render the `null`
// state identically, then the client fills in the real round.
export function useClientRound<T>(factory: () => T) {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    setValue(factory());
    // Intentionally only on mount — `next()` below is the regeneration path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function next() {
    setValue(factory());
  }

  return [value, next] as const;
}
