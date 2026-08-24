"use client";

import { useEffect, useState } from "react";
import { useProfile } from "./ProfileContext";
import { AGE_BANDS, EXPERIENCE_LEVELS, MAJORS, TRACKS, type TrackId } from "./tracks";
import { AVATARS, AvatarSprite, type AvatarId } from "./avatars";
import type { AccountKind } from "./ProfileContext";
import { ASSESSMENT_TICKETS, ASSESSMENT_ACCURACY } from "../assessments/requirements";
import TokenIcon from "../access/TokenIcon";
import TicketIcon from "../progress/TicketIcon";

type Step = "account" | "auth" | "avatar" | "tracks" | "about" | "orientation";

const STEPS: Step[] = ["account", "avatar", "tracks", "about", "orientation"];

export default function Onboarding() {
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState<Step>("account");
  const [tracks, setTracks] = useState<TrackId[]>([]);
  const [major, setMajor] = useState("");
  const [experience, setExperience] = useState("");
  const [ageBand, setAgeBand] = useState("");
  const [account, setAccount] = useState<AccountKind>("guest");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("duck");

  // Real fields for the auth step — separate from the local-only
  // displayName/avatar/tracks above, which stay client-side for now.
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // The auth screen sits outside the numbered steps rather than pretending
  // to be one of them, since "signup" and "login" aren't really progress —
  // they're a fork before progress starts.
  const index = Math.max(0, STEPS.indexOf(step));

  // If a real session already exists — e.g. someone just signed up or
  // logged in on the standalone /login page and got redirected here — don't
  // make them click through "Sign up" again. Skip straight to picking a
  // character, same as finishing the auth step normally would.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: { displayName: string | null } | null }) => {
        if (cancelled || !data.user) return;
        setAccount("account");
        if (data.user.displayName) setDisplayName(data.user.displayName);
        setStep((current) => (current === "account" ? "avatar" : current));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTrack = (id: TrackId) =>
    setTracks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const finish = () =>
    completeOnboarding({ account, displayName, avatar, tracks, major, experience, ageBand });

  const openAuth = (which: "signup" | "login") => {
    setAuthMode(which);
    setAuthError(null);
    setStep("auth");
  };

  // Real signup/login against app/api/auth/{signup,login}/route.ts — sets an
  // actual httpOnly session cookie backed by the `users` table. Only on
  // success does the flow continue to the avatar/track picker.
  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const body: Record<string, string> =
        authMode === "signup"
          ? { email: authEmail, password: authPassword, username: authUsername, displayName }
          : { email: authEmail, password: authPassword };
      const res = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { user?: { email: string; username: string | null; displayName: string | null }; error?: string };
      if (!res.ok) {
        setAuthError(data.error ?? "Something went wrong.");
        return;
      }
      if (data.user?.displayName && !displayName) setDisplayName(data.user.displayName);
      setAccount("account");
      setStep("avatar");
    } catch {
      setAuthError("Network error — the request never reached the server.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-panel">
        <div className="onboarding-progress" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s} className={i <= index ? "onboarding-pip is-on" : "onboarding-pip"} />
          ))}
        </div>

        {step === "account" && (
          <>
            <p className="onboarding-kicker">Player 1</p>
            <h2 className="onboarding-title">Save your progress?</h2>
            <p className="onboarding-copy">
              An account keeps your tickets, accuracy, and tokens. Guests can play every
              always-free game, but tokens, paid sessions, and the daily challenge need an account.
            </p>

            <div className="onboarding-actions">
              <button type="button" className="onboarding-btn is-primary" onClick={() => openAuth("signup")}>
                Sign up
              </button>
              <button type="button" className="onboarding-btn" onClick={() => openAuth("login")}>
                Log in
              </button>
              <button
                type="button"
                className="onboarding-btn"
                onClick={() => {
                  setAccount("guest");
                  setStep("avatar");
                }}
              >
                Continue as guest
              </button>
            </div>
          </>
        )}

        {step === "auth" && (
          <>
            <p className="onboarding-kicker">{authMode === "signup" ? "Create account" : "Welcome back"}</p>
            <h2 className="onboarding-title">{authMode === "signup" ? "Sign up" : "Log in"}</h2>

            <form onSubmit={submitAuth}>
              {authMode === "signup" && (
                <>
                  <label className="onboarding-field">
                    <span>Display name (optional)</span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How you appear on the leaderboard"
                      autoComplete="off"
                    />
                  </label>

                  <label className="onboarding-field">
                    <span>Username (optional)</span>
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="Unique handle, no spaces"
                      autoComplete="off"
                    />
                  </label>
                </>
              )}

              <label className="onboarding-field">
                <span>Email</span>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="onboarding-field">
                <span>Password</span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder={authMode === "signup" ? "At least 8 characters" : "Your password"}
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  minLength={authMode === "signup" ? 8 : undefined}
                  required
                />
              </label>

              {authError && (
                <p className="onboarding-notice is-error" role="alert">
                  {authError}
                </p>
              )}

              <div className="onboarding-actions">
                <button type="button" className="onboarding-btn" onClick={() => setStep("account")}>Back</button>
                <button type="submit" className="onboarding-btn is-primary" disabled={authSubmitting}>
                  {authSubmitting ? "Working..." : authMode === "signup" ? "Create account" : "Log in"}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "avatar" && (
          <>
            <p className="onboarding-kicker">Step 2</p>
            <h2 className="onboarding-title">Pick your character</h2>
            <p className="onboarding-copy">This is you on the leaderboard.</p>

            <div className="avatar-grid">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className={avatar === a.id ? "avatar-option is-on" : "avatar-option"}
                  aria-pressed={avatar === a.id}
                  onClick={() => setAvatar(a.id)}
                >
                  <AvatarSprite id={a.id} />
                  <span>{a.name}</span>
                </button>
              ))}
            </div>

            <div className="onboarding-actions">
              <button type="button" className="onboarding-btn" onClick={() => setStep("account")}>Back</button>
              <button type="button" className="onboarding-btn is-primary" onClick={() => setStep("tracks")}>Next</button>
            </div>
          </>
        )}

        {step === "tracks" && (
          <>
            <p className="onboarding-kicker">Step 3</p>
            <h2 className="onboarding-title">What are you interviewing for?</h2>
            <p className="onboarding-copy">Pick as many as apply. This weights what counts toward your readiness — it never hides games.</p>

            <div className="onboarding-choice-grid">
              {TRACKS.map((track) => (
                <button
                  type="button"
                  key={track.id}
                  className={tracks.includes(track.id) ? "onboarding-choice is-on" : "onboarding-choice"}
                  aria-pressed={tracks.includes(track.id)}
                  onClick={() => toggleTrack(track.id)}
                >
                  <span className="onboarding-choice-label">{track.label}</span>
                  <span className="onboarding-choice-blurb">{track.blurb}</span>
                </button>
              ))}
            </div>

            <div className="onboarding-actions">
              <button type="button" className="onboarding-btn" onClick={() => setStep("avatar")}>Back</button>
              <button
                type="button"
                className="onboarding-btn is-primary"
                disabled={tracks.length === 0}
                onClick={() => setStep("about")}
              >
                Next
              </button>
            </div>
            {tracks.length === 0 && <p className="onboarding-hint">Pick at least one to continue.</p>}
          </>
        )}

        {step === "about" && (
          <>
            <p className="onboarding-kicker">Step 4</p>
            <h2 className="onboarding-title">A bit about you</h2>
            <p className="onboarding-copy">All optional — it only shapes which games get recommended first.</p>

            <label className="onboarding-field">
              <span>Field of study</span>
              <select value={major} onChange={(e) => setMajor(e.target.value)}>
                <option value="">Select…</option>
                {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>

            <label className="onboarding-field">
              <span>Stage</span>
              <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                <option value="">Select…</option>
                {EXPERIENCE_LEVELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>

            <label className="onboarding-field">
              <span>Age range</span>
              <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)}>
                <option value="">Select…</option>
                {AGE_BANDS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>

            <div className="onboarding-actions">
              <button type="button" className="onboarding-btn" onClick={() => setStep("tracks")}>Back</button>
              <button type="button" className="onboarding-btn is-primary" onClick={() => setStep("orientation")}>Next</button>
            </div>
          </>
        )}

        {step === "orientation" && (
          <>
            <p className="onboarding-kicker">How this works</p>
            <h2 className="onboarding-title">Three numbers to know</h2>
            <p className="onboarding-copy">
              You learn by playing. Every game asks real questions and grades them — that is where
              all three numbers come from.
            </p>

            <ul className="onboarding-legend">
              <li>
                <span className="onboarding-legend-icon"><TokenIcon /></span>
                <span>
                  <strong>Tokens</strong>
                  Currency, free players only. Spends to unlock a paid game for 3 rounds. An
                  Infinity Pass removes the gate entirely.
                </span>
              </li>
              <li>
                <span className="onboarding-legend-icon"><TicketIcon /></span>
                <span>
                  <strong>Tickets</strong>
                  One for every question you answer correctly. Never goes down — a wrong answer
                  costs you nothing here.
                </span>
              </li>
              <li>
                <span className="onboarding-legend-icon onboarding-legend-acc" aria-hidden="true" />
                <span>
                  <strong>Accuracy</strong>
                  How often you are right, out of every question graded. This one moves both ways,
                  and revealing an answer counts against it.
                </span>
              </li>
            </ul>

            <p className="onboarding-copy">
              Losing a hand of blackjack or getting shipwrecked never touches tickets or accuracy —
              that is variance, not a mistake. Only questions are graded.
            </p>

            <p className="onboarding-copy onboarding-gate">
              Assessments unlock at <strong>{ASSESSMENT_TICKETS} tickets</strong> and{" "}
              <strong>{ASSESSMENT_ACCURACY}% accuracy</strong>.
            </p>

            <div className="onboarding-actions">
              <button type="button" className="onboarding-btn" onClick={() => setStep("about")}>Back</button>
              <button type="button" className="onboarding-btn is-primary" onClick={finish}>Enter the lab</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
