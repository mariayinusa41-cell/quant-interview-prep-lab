"use client";

import { useRouter } from "next/navigation";
import { useAccess, type AccessMode } from "./AccessContext";
import { useProfile } from "../profile/ProfileContext";

const modes: { id: AccessMode; label: string; detail: string; note: string }[] = [
  {
    id: "developer",
    label: "Developer",
    detail: "Full local access",
    note: "All games open immediately.",
  },
  {
    id: "free",
    label: "Free user",
    detail: "100 tokens",
    note: "Free games stay open; token games cost 10-40 per 3 rounds.",
  },
  {
    id: "infinity",
    label: "Infinity pass",
    detail: "Unlimited play",
    note: "No token gate, and the only tier that can open assessments.",
  },
];

export default function AccessModePicker() {
  const { mode, setMode } = useAccess();
  const { profile, saveProfile, restartOnboarding } = useProfile();
  const router = useRouter();

  // Re-opening the sign-in screen is a preview tool, not a logout: tickets,
  // accuracy, and tokens are all left untouched.
  const openSignIn = () => {
    restartOnboarding();
    router.push("/?login=1");
  };

  return (
    <section className="access-mode-section" aria-labelledby="access-mode-title">
      <div>
        <p className="label">Preview the product modes</p>
        <h2 id="access-mode-title">Choose your access</h2>
        <p className="section-intro">Switch modes here and the same labs will respond like the developer, free, or unlimited experience.</p>
      </div>

      <div className="access-mode-grid" role="group" aria-label="Access modes">
        {modes.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`access-mode-option${mode === option.id ? " is-selected" : ""}`}
            aria-pressed={mode === option.id}
            onClick={() => setMode(option.id)}
          >
            <span className="access-mode-option-label">{option.label}</span>
            <span className="access-mode-option-detail">{option.detail}</span>
            <span className="access-mode-option-note">{option.note}</span>
            <span className="access-mode-option-cta">{mode === option.id ? "Selected" : "Preview mode"}</span>
          </button>
        ))}
      </div>

      <div className="access-account-row">
        <div className="access-account-toggle" role="group" aria-label="Account state">
          <span className="access-account-label">Account state</span>
          <button
            type="button"
            className={profile.account === "guest" ? "lb-tab is-on" : "lb-tab"}
            aria-pressed={profile.account === "guest"}
            onClick={() => saveProfile({ account: "guest" })}
          >
            Guest
          </button>
          <button
            type="button"
            className={profile.account === "account" ? "lb-tab is-on" : "lb-tab"}
            aria-pressed={profile.account === "account"}
            onClick={() => saveProfile({ account: "account" })}
          >
            Signed in
          </button>
        </div>

        <button type="button" className="lb-tab access-signin-btn" onClick={openSignIn}>
          Open sign-in screen
        </button>
      </div>

      <p className="access-account-note">
        Guest can only play the always-free games — no tokens, no daily challenge. Opening the
        sign-in screen replays onboarding without erasing your tickets or tokens.
      </p>
    </section>
  );
}
