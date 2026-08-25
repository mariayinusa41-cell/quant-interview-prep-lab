"use client";

import { useState } from "react";
import { useProfile } from "../profile/ProfileContext";

// Log out and account settings, surfaced in the hub.
//
// Both already existed, but only on /login — which a signed-in player has no
// reason to visit, since that URL reads as "the page for people who aren't
// signed in". Putting them next to the identity they act on is the whole
// change.
export default function AccountActions() {
  const { profile, saveProfile } = useProfile();
  const [busy, setBusy] = useState(false);

  // Guests have nothing to log out of; the sign-up banner is their call to
  // action instead.
  if (profile.account !== "account") return null;

  const logOut = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // The session cookie may already be gone. Fall through and clear the
      // local side anyway — leaving the profile claiming "Signed in" after
      // the user asked to leave is the worse failure.
    }
    // Clear the identity too, not just the session flag. Otherwise the next
    // person on a shared machine sees the previous user's name, avatar and
    // tracks sitting under "Guest session".
    //
    // Safe to discard because personalization now lives on the account
    // (users.avatar / tracks_json / major / …) — logging back in re-hydrates
    // all of it from the server, so nothing is actually lost.
    saveProfile({
      account: "guest",
      displayName: "",
      tracks: [],
      major: "",
      experience: "",
      ageBand: "",
      personalized: false,
    });
    // Full navigation rather than a client transition: every context on the
    // page (access, progress, profile) re-reads its state on mount, so this
    // is what guarantees nothing is left holding the old session's data.
    window.location.href = "/";
  };

  return (
    <div className="account-actions">
      <a className="account-action-btn" href="/login">
        Account settings
      </a>
      <button type="button" className="account-action-btn is-out" disabled={busy} onClick={logOut}>
        {busy ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
