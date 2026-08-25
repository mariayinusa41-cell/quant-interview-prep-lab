"use client";

import { useEffect, useState } from "react";
import { useProfile } from "./ProfileContext";
import { AGE_BANDS, EXPERIENCE_LEVELS, MAJORS, TRACKS, type TrackId } from "./tracks";
import { AVATARS, AvatarSprite, type AvatarId } from "./avatars";
import { ASSESSMENT_TICKETS, ASSESSMENT_ACCURACY } from "../assessments/requirements";
import TokenIcon from "../access/TokenIcon";
import TicketIcon from "../progress/TicketIcon";

// One state machine for every way into an account, rebuilt after the old
// version fell apart at the seams:
//
//   choice ──► auth ──► avatar ──► tracks ──► about ──► orientation ──► hub
//     │                   ▲
//     │  (live session) ──┘   someone who signed in elsewhere (/login, or a
//     │                       previous visit) resumes at personalization —
//     │                       never re-asked for credentials.
//     └──► guest ──► hub      instant, with defaults; personalization is
//                             owed, and runs the moment they sign up.
//
// The invariants the old flow broke, now held in one place:
//  - `account` flips to "account" the moment auth succeeds, not at the end
//    of the flow — so nothing downstream can see a signed-in guest.
//  - `personalized` is set only by actually finishing avatar/tracks/about.
//    LoginForm checks it to decide whether to route back through here.
//  - Personalization can never be skipped by taking a different door into
//    auth: every door converges on the same steps.

type Step = "choice" | "auth" | "avatar" | "tracks" | "about" | "orientation";

const PROGRESS_STEPS: Step[] = ["choice", "avatar", "tracks", "about", "orientation"];

export default function Onboarding() {
  const { profile, saveProfile, completeOnboarding } = useProfile();
  const [step, setStep] = useState<Step>("choice");

  const [tracks, setTracks] = useState<TrackId[]>(profile.tracks);
  const [major, setMajor] = useState(profile.major);
  const [experience, setExperience] = useState(profile.experience);
  const [ageBand, setAgeBand] = useState(profile.ageBand);
  const [displayName, setDisplayName] = useState(
    profile.displayName === "Guest" ? "" : profile.displayName,
  );
  const [avatar, setAvatar] = useState<AvatarId>(profile.avatar);

  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const index = Math.max(0, PROGRESS_STEPS.indexOf(step === "auth" ? "choice" : step));

  // A live session means credentials are settled — whether they were entered
  // here, on /login, or on a previous visit. Resume at personalization.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: { displayName: string | null } | null }) => {
        if (cancelled || !data.user) return;
        saveProfile({ account: "account" });
        if (data.user.displayName) {
          setDisplayName((current) => current || data.user!.displayName!);
        }
        setStep((current) => (current === "choice" || current === "auth" ? "avatar" : current));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTrack = (id: TrackId) =>
    setTracks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  // The only exit that marks personalization done.
  const finish = () => {
    completeOnboarding({
      account: profile.account,
      displayName,
      avatar,
      tracks,
      major,
      experience,
      ageBand,
      personalized: true,
    });
    // Mirror to the account so this follows the user to their next device.
    // Fire-and-forget: local state is already saved, and the /login page can
    // re-save later if this request loses a race with a flaky network.
    if (profile.account === "account") {
      fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, avatar, tracks, major, experience, ageBand }),
      }).catch(() => {});
    }
  };

  // A guest is here to look around, not to fill in a form — straight in on
  // defaults. `personalized` stays false, which is the hook LoginForm uses
  // to route them through avatar/tracks/about when they later sign up.
  const startAsGuest = () => {
    const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)].id;
    completeOnboarding({
      account: "guest",
      displayName: "Guest",
      avatar: randomAvatar,
      tracks: [],
      major: "",
      experience: "",
      ageBand: "",
      personalized: false,
    });
  };

  const openAuth = (which: "signup" | "login") => {
    setAuthMode(which);
    setAuthError(null);
    setStep("auth");
  };

  // Real signup/login against app/api/auth/{signup,login}/route.ts — sets an
  // actual httpOnly session cookie backed by the `users` table.
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
      const data = (await res.json()) as {
        user?: { email: string; username: string | null; displayName: string | null };
        error?: string;
      };
      if (!res.ok) {
        setAuthError(data.error ?? "Something went wrong.");
        return;
      }
      // Promote immediately — before personalization — so no screen anywhere
      // can render "guest" against a live session.
      saveProfile({ account: "account" });
      if (data.user?.displayName && !displayName) setDisplayName(data.user.displayName);
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
          {PROGRESS_STEPS.map((s, i) => (
            <span key={s} className={i <= index ? "onboarding-pip is-on" : "onboarding-pip"} />
          ))}
        </div>

        {step === "choice" && (
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
              <button type="button" className="onboarding-btn" onClick={startAsGuest}>
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
                <button type="button" className="onboarding-btn" onClick={() => setStep("choice")}>Back</button>
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
