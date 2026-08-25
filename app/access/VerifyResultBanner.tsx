"use client";

import { useEffect, useState } from "react";

// app/api/auth/verify/route.ts redirects to "/?verify=<flag>" after a click
// from the email. Nothing read that flag, so following the link looked
// identical to loading the site normally — no confirmation that it worked,
// and no explanation when it didn't.
//
// This is mounted at the top level rather than inside the hub's profile tab
// because "/" is exactly where that redirect lands, and a returning player
// may be looking at the attract screen or the hub depending on how far
// through onboarding they are.

// Mirrors the flags in app/api/auth/verify/route.ts.
const MESSAGES: Record<string, { tone: "ok" | "bad"; text: string }> = {
  ok: { tone: "ok", text: "Email verified - your welcome gift is waiting in your profile." },
  invalid: { tone: "bad", text: "That verification link has expired or was already used. Send a fresh one from your profile." },
  missing: { tone: "bad", text: "That link was missing its verification token." },
  error: { tone: "bad", text: "Something went wrong verifying that link. Try sending a fresh one from your profile." },
};

export default function VerifyResultBanner() {
  const [flag, setFlag] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("verify");
    if (!v) return;
    setFlag(v);
    // Strip the flag so a refresh doesn't replay the banner. replaceState
    // keeps it out of the back-button history.
    params.delete("verify");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  const message = flag ? MESSAGES[flag] : null;
  if (!message) return null;

  return (
    <div className={message.tone === "ok" ? "verify-banner is-ok" : "verify-banner is-bad"} role="status">
      <span>{message.text}</span>
      <button type="button" className="verify-banner-close" onClick={() => setFlag(null)} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
