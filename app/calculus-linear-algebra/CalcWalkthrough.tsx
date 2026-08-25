"use client";

import { useState, type ReactNode } from "react";

// A walkthrough step is a *played move*, not a lecture slide. `board` renders
// the real game UI — same components, same CSS classes the live round uses —
// frozen in the state it would be in at that moment, so the player watches an
// actual round being worked rather than reading about one.
export type DemoStep = {
  /** Short heading: what's happening on this move. */
  term: string;
  /** Why this move — the reasoning a strong player would say out loud. */
  body: string;
  /** The board as it looks right now. */
  board: ReactNode;
  /** Optional worked arithmetic for this move, in monospace. */
  math?: string[];
  /** The takeaway, trap, or sanity check. */
  note?: string;
};

// Deliberately not wrapped in AccessStartButton: entry was already paid for on
// the lab's game-select screen, and each round's "next" button charges
// separately. A tutorial that spent a round would punish exactly the players
// who need it.
export default function CalcWalkthrough({
  steps,
  title,
  onDone,
}: {
  steps: DemoStep[];
  title: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="calc-subgame calc-guide">
      <div className="calc-guide-head">
        <p className="calc-guide-eyebrow">Watch one round · {title}</p>
        <button type="button" className="calc-guide-skip" onClick={onDone}>
          Skip &raquo;
        </button>
      </div>

      {/* The board sits above the narration on purpose: the player should see
          the move land first, then read why it was made. */}
      <div className="calc-demo-board">{current.board}</div>

      <div className="calc-taylor-panel">
        <p className="mm-teach-progress">
          {step + 1} / {steps.length}
        </p>
        <p className="mm-teach-term">{current.term}</p>

        <div className="hs-tutorial-step">
          <p>{current.body}</p>
        </div>

        {current.math && (
          <pre className="calc-guide-math" aria-label="worked calculation">
            {current.math.join("\n")}
          </pre>
        )}

        {current.note && <p className="mm-teach-note">{current.note}</p>}

        <div className="mm-teach-nav">
          {step > 0 && (
            <button type="button" className="hs-chunky-btn is-secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {isLast ? (
            <button type="button" className="hs-chunky-btn" onClick={onDone}>
              Your turn
            </button>
          ) : (
            <button type="button" className="hs-chunky-btn" onClick={() => setStep((s) => s + 1)}>
              Next move
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
