"use client";

import type { ReactNode } from "react";

// Wraps content that only means something once there is an account behind
// it, and washes it out for guests.
//
// The point is to show the shape of what you get rather than hide it: a
// guest looking at their profile was previously shown a full page of zeros —
// 0 tickets, 0 accuracy, an empty skill map, 8 locked achievements — which
// reads as "this product is empty" rather than "this fills in once you sign
// up". Dimmed-with-a-reason communicates the second.
//
// `inert` (React 19) takes the whole subtree out of the tab order and blocks
// pointer events, so nothing behind the wash is reachable by keyboard or
// click — dimming alone would leave a screen-reader user tabbing through
// controls they cannot use.
export default function GuestGate({ active, children }: { active: boolean; children: ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <div className="guest-gate-washed" inert>
      {children}
    </div>
  );
}

/**
 * The ask itself. Kept in normal flow as its own banner rather than
 * absolutely positioned over the washed content: the washed regions vary in
 * height, and over a short one (the stats row is ~100px) an overlay clipped
 * its own button.
 */
export function GuestSignupBanner() {
  return (
    <section className="section guest-banner">
      <p className="guest-gate-title">Sign up to unlock your profile</p>
      <p className="guest-gate-body">
        Tickets, accuracy, your skill map and achievements all start tracking the moment you have an
        account — and verifying your email lands you a welcome gift of tokens.
      </p>
      <a className="guest-gate-btn" href="/login">
        Sign up now
      </a>
      <p className="guest-gate-alt">
        Already have an account? <a href="/login">Log in</a>
      </p>
    </section>
  );
}
