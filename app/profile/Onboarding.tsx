"use client";

import { useState } from "react";
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

  // The auth screen is a visual mockup, so it sits outside the numbered
  // steps rather than pretending to be one.
  const index = Math.max(0, STEPS.indexOf(step));

  const toggleTrack = (id: TrackId) =>
    setTracks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const finish = () =>
    completeOnboarding({ account, displayName, avatar, tracks, major, experience, ageBand });

  const openAuth = (which: "signup" | "login") => {
    setAuthMode(which);
    setStep("auth");
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

            <p className="onboarding-notice" role="status">
              Design preview — this form is not connected to anything. Nothing you type is sent or
              stored, so do not enter a real password.
            </p>

            <label className="onboarding-field">
              <span>Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you appear on the leaderboard"
                autoComplete="off"
              />
            </label>

            <label className="onboarding-field">
              <span>Email</span>
              <input type="text" placeholder="you@example.com" autoComplete="off" disabled />
            </label>

            <label className="onboarding-field">
              <span>Password</span>
              <input type="text" placeholder="Disabled in this preview" autoComplete="off" disabled />
            </label>

            <div className="onboarding-actions">
              <button type="button" className="onboarding-btn" onClick={() => setStep("account")}>Back</button>
              <button
                type="button"
                className="onboarding-btn is-primary"
                onClick={() => {
                  setAccount("account");
                  setStep("avatar");
                }}
              >
                {authMode === "signup" ? "Create account" : "Log in"}
              </button>
            </div>
            <p className="onboarding-hint">
              Continues as a simulated signed-in player so you can see the full experience.
            </p>
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
