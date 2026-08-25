"use client";

import { useEffect, useState } from "react";

const KEY_PREFIX = "gradient-walkthrough-seen:";

// Whether to show a game's worked example before its first round.
//
// Same hydration constraint as useClientRound: localStorage doesn't exist
// during SSR, so reading it inline would render one thing on the server and
// another on the client. `show` stays null until mount — callers render
// their existing loading state for that beat — and only then resolves to a
// real boolean.
export function useWalkthrough(gameKey: string) {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(KEY_PREFIX + gameKey) === "1";
    } catch {
      // Private mode or storage disabled — showing the guide again is a much
      // cheaper failure than silently swallowing it.
    }
    setShow(!seen);
  }, [gameKey]);

  // Called when the player finishes or skips: either way they've been offered
  // it, so it shouldn't reappear on every visit.
  function dismiss() {
    try {
      localStorage.setItem(KEY_PREFIX + gameKey, "1");
    } catch {
      /* noop */
    }
    setShow(false);
  }

  function replay() {
    setShow(true);
  }

  return { show, dismiss, replay };
}
