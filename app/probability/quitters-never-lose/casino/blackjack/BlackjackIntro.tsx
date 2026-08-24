"use client";

import { useEffect, useState } from "react";

// Story-then-rules intro, same self-chaining relative-timer pattern used in
// PirateStory.tsx: each phase schedules only its own next step, so a Skip
// click (an out-of-band setPhase call) cancels the pending timer via effect
// cleanup and starts fresh from wherever it lands — nothing gets out of sync.

const LINES: string[] = [
  "Blackjack: beat the dealer's hand without going over 21.",
  "Dealer stands on all 17s. A natural 21 (\"blackjack\") pays 3:2.",
  "Hit, Stand, or Double Down — your call, every hand.",
  "Now the part most players never learn: card counting.",
  "High cards — 10s, face cards, Aces — are good for you. They're what make a blackjack (paid 3:2), and they make the dealer bust more often too.",
  "So: the more high cards still in the shoe, the better your odds. The fewer, the worse.",
  "The Hi-Lo system tracks that balance with one running number, updated as each card is dealt.",
  "A high card (10, J, Q, K, A) just got dealt — one fewer is left in the shoe, which is bad for you. Count it −1.",
  "A low card (2–6) just got dealt — the shoe is now relatively richer in high cards, which is good for you. Count it +1.",
  "Cards 7–9 barely shift that balance either way — count them 0.",
  "Add up every card you see. A positive running count means the shoe is currently rich in high cards — the odds have tilted your way.",
  "One honest note: this is legal. Card counting is just mental math, not cheating — a casino can ask a suspected counter to leave, but no law is being broken.",
];

const LAST_PHASE = LINES.length; // one extra phase for the "let's play" state

const HOLD_AFTER: number[] = [
  2200, // intro line
  2600,
  2400,
  2200,
  2900,
  2700,
  2400,
  2900, // -1 for high cards — picture appears here
  2900,
  2400,
  3100,
  3400, // legality note — holds a beat longer before "let's play"
];

const GROUP_PICTURE_FROM = 7; // once we assign the first point value (-1), show the visual groups and keep it up

function GroupCard({ label, tone }: { label: string; tone: "low" | "mid" | "high" }) {
  return (
    <div className={`bj-intro-card bj-intro-card-${tone}`}>
      <span className="bj-intro-card-label">{label}</span>
    </div>
  );
}

export default function BlackjackIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (phase >= LAST_PHASE) return;
    const t = window.setTimeout(() => setPhase((p) => Math.min(p + 1, LAST_PHASE)), HOLD_AFTER[phase]);
    return () => window.clearTimeout(t);
  }, [phase]);

  const canSkip = phase < LAST_PHASE;
  const handleSkip = () => setPhase(LAST_PHASE);

  return (
    <div className="pirate-stage-content">
      {canSkip && (
        <button type="button" className="skip-btn" onClick={handleSkip}>
          Skip
        </button>
      )}

      <p className="pirate-kicker">Quitters Never Lose</p>
      <h1 className="pirate-story-line pirate-enter answer-title">Blackjack</h1>

      <div style={{ minHeight: 110 }}>
        {LINES.slice(0, phase + 1).map((line, i) => (
          <p key={i} className="pirate-story-line pirate-enter" style={{ fontSize: "1rem" }}>
            {line}
          </p>
        ))}
      </div>

      {phase >= GROUP_PICTURE_FROM && (
        <div className="bj-intro-groups pirate-enter">
          <div className="bj-intro-group">
            <p className="bj-intro-group-title" style={{ color: "var(--pixel-good)" }}>
              LOW · +1
            </p>
            <div className="bj-intro-group-row">
              <GroupCard label="2" tone="low" />
              <GroupCard label="3" tone="low" />
              <GroupCard label="4" tone="low" />
              <GroupCard label="5" tone="low" />
              <GroupCard label="6" tone="low" />
            </div>
          </div>
          <div className="bj-intro-group">
            <p className="bj-intro-group-title">MID · 0</p>
            <div className="bj-intro-group-row">
              <GroupCard label="7" tone="mid" />
              <GroupCard label="8" tone="mid" />
              <GroupCard label="9" tone="mid" />
            </div>
          </div>
          <div className="bj-intro-group">
            <p className="bj-intro-group-title" style={{ color: "var(--pixel-bad)" }}>
              HIGH · −1
            </p>
            <div className="bj-intro-group-row">
              <GroupCard label="10" tone="high" />
              <GroupCard label="J" tone="high" />
              <GroupCard label="Q" tone="high" />
              <GroupCard label="K" tone="high" />
              <GroupCard label="A" tone="high" />
            </div>
          </div>
        </div>
      )}

      {phase >= LAST_PHASE && (
        <button type="button" className="continue-btn pirate-enter" onClick={onDone}>
          Let's play
        </button>
      )}
    </div>
  );
}
