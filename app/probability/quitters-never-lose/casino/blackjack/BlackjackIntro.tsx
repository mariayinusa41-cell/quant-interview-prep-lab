"use client";

import { useState } from "react";

// Arcade-style stepped intro, same pattern as Russian Roulette's tutorial:
// short slides, a Next button, no typing animation. The old version streamed
// seventeen lines onto one screen on auto-timers, which read as a wall of
// text you couldn't pace yourself through.
//
// Steps that talk about card values show the Hi-Lo groups as actual card
// chips under the words, so the rule arrives with its picture.

type Step = { lines: string[]; showGroups?: boolean };

const STEPS: Step[] = [
  {
    lines: [
      "Beat the dealer without going over 21.",
      "Dealer stands on all 17s. A natural 21 pays 3:2.",
    ],
  },
  {
    lines: [
      "Hit, Stand, or Double Down. Your call, every hand.",
      "Now the part most players never learn: counting.",
    ],
  },
  {
    lines: [
      "High cards left in the shoe are GOOD for you.",
      "They make blackjacks, and they bust the dealer.",
    ],
  },
  {
    lines: [
      "Hi-Lo tracks that with one running number.",
      "Low card dealt: +1. Middle: 0. High: -1.",
    ],
    showGroups: true,
  },
  {
    lines: [
      "Add up every card you see, hand after hand.",
      "A positive count means the shoe has tilted your way.",
    ],
    showGroups: true,
  },
  {
    lines: [
      "Each hand, the pit boss may ask for your count.",
      "Answer before he reaches you. Three misses and you're barred.",
    ],
  },
  {
    lines: [
      "Counting is legal. It's just mental math.",
      "But the casino can still show you the door.",
    ],
  },
];

function GroupCard({ label, tone }: { label: string; tone: "low" | "mid" | "high" }) {
  return (
    <div className={`bj-intro-card bj-intro-card-${tone}`}>
      <span className="bj-intro-card-label">{label}</span>
    </div>
  );
}

function HiLoGroups() {
  return (
    <div className="bj-intro-groups">
      <div className="bj-intro-group">
        <p className="bj-intro-group-title" style={{ color: "var(--pixel-good)" }}>LOW · +1</p>
        <div className="bj-intro-group-row">
          {["2", "3", "4", "5", "6"].map((r) => <GroupCard key={r} label={r} tone="low" />)}
        </div>
      </div>
      <div className="bj-intro-group">
        <p className="bj-intro-group-title" style={{ color: "var(--ink-3)" }}>MID · 0</p>
        <div className="bj-intro-group-row">
          {["7", "8", "9"].map((r) => <GroupCard key={r} label={r} tone="mid" />)}
        </div>
      </div>
      <div className="bj-intro-group">
        <p className="bj-intro-group-title" style={{ color: "var(--pixel-bad)" }}>HIGH · −1</p>
        <div className="bj-intro-group-row">
          {["10", "J", "Q", "K", "A"].map((r) => <GroupCard key={r} label={r} tone="high" />)}
        </div>
      </div>
    </div>
  );
}

export default function BlackjackIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Quitters Never Lose</p>
      <h1 className="pirate-story-line answer-title">Blackjack</h1>

      <div className="pixel-stage">
        <p className="mm-teach-progress">{step + 1} / {STEPS.length}</p>

        <div className="hs-tutorial-step">
          {current.lines.map((line) => <p key={line}>{line}</p>)}
        </div>

        {current.showGroups && <HiLoGroups />}

        <div className="mm-teach-nav">
          {step > 0 && (
            <button type="button" className="hs-chunky-btn is-secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {isLast ? (
            <button type="button" className="hs-chunky-btn" onClick={onDone}>
              Let&rsquo;s play
            </button>
          ) : (
            <button type="button" className="hs-chunky-btn" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
