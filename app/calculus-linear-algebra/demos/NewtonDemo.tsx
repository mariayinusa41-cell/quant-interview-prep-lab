"use client";

import type { DemoStep } from "../CalcWalkthrough";

// A played round of Newton Stepper: x² − 9 = 0 from x₀ = 1, tolerance 1e-4.
// Step values verified against calcMath's newtonStep —
//   x₁ = 5, x₂ = 3.4, x₃ = 3.023529, x₄ = 3.000092 (err 9.2e-5) → 4 iterations
// Iteration counts across the game's whole a-range (3…20) were computed with
// the same loop the game runs: a=3 → 3, a=4…9 → 4, a=10…20 → 5.

type Row = { n: number; x: string; err: string };

const ALL_ROWS: Row[] = [
  { n: 1, x: "5.000000", err: "2.00e+0" },
  { n: 2, x: "3.400000", err: "4.00e-1" },
  { n: 3, x: "3.023529", err: "2.35e-2" },
  { n: 4, x: "3.000092", err: "9.16e-5" },
];

function Board({ typed, rows, reveal }: { typed?: string; rows?: number; reveal?: boolean }) {
  const shown = ALL_ROWS.slice(0, rows ?? 0);
  return (
    <div className="calc-taylor-panel">
      <p className="calc-taylor-target">
        Solve <strong>x² − 9 = 0</strong> from x₀ = 1
      </p>

      {!reveal ? (
        <div className="calc-input-row">
          <input
            type="text"
            className="calc-input"
            value={typed ?? ""}
            placeholder="Number of iterations (e.g. 4)"
            readOnly
            disabled
          />
          <button type="button" className="calc-submit-btn" disabled aria-disabled="true">
            Run it
          </button>
        </div>
      ) : (
        <p className="quiz-q-explain is-correct">
          True root ≈ 3.00000. It took <strong>4</strong> iterations to get within 0.0001. You guessed 4 (+3 pts).
        </p>
      )}

      {shown.length > 0 && (
        <div className="calc-newton-table">
          {shown.map((r) => (
            <div key={r.n} className="calc-newton-row">
              <span>n={r.n}</span>
              <span>x = {r.x}</span>
              <span>|error| = {r.err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const NEWTON_DEMO: DemoStep[] = [
  {
    term: "This is the board",
    body:
      "Unusual ask: you're not solving for the root, you're predicting how many Newton iterations it takes to get within 1e-4 of it — before seeing a single step. Type a count, hit Run it, and the table plays out.",
    board: <Board />,
    note: "Exact guess is 3 points, off by one is 2, off by two is 1. So a good estimate is worth almost as much as certainty.",
  },
  {
    term: "Simplify the update rule first",
    body:
      "Newton replaces the curve with its tangent line and jumps to where that line hits zero. For x² − a the whole thing collapses to an average — which means you can genuinely run a couple of steps in your head before guessing.",
    board: <Board />,
    math: ["xₙ₊₁  =  xₙ − f(xₙ)/f'(xₙ)", "      =  xₙ − (xₙ² − a)/(2xₙ)", "      =  ( xₙ + a/xₙ ) / 2"],
    note: "That last form is the Babylonian square-root method — Newton's method rediscovers it.",
  },
  {
    term: "Run the first two steps mentally",
    body:
      "Root is 3, and I'm starting at 1 — a bad start, so the first jump overshoots hard to 5. The second lands at 3.4. Far from the root Newton is unimpressive, and those sloppy early steps dominate the count.",
    board: <Board rows={2} />,
    math: ["x₁ = (1 + 9/1)/2  =  5      err 2.0e+0", "x₂ = (5 + 9/5)/2  =  3.4    err 4.0e-1"],
  },
  {
    term: "Now count on the error squaring",
    body:
      "From 3.4 the error is 0.4. Convergence is quadratic here, so each step roughly squares it: 0.4 → 0.02 → 0.0001. That's two more steps to clear the tolerance, giving 4 total. I type 4 without computing the last two exactly.",
    board: <Board typed="4" rows={2} />,
    math: ["err after x₂  ≈  4e-1", "→ x₃  ≈  2e-2      (squared)", "→ x₄  ≈  9e-5   ✓  (squared again)"],
    note: "Quadratic convergence means correct digits double each step — this is why the answer is never a big number.",
  },
  {
    term: "Run it — the table confirms the estimate",
    body:
      "The real table matches the mental one: 2.0, then 0.4, then 2.35e-2, then 9.16e-5. Four iterations, three points. The estimate came from the structure, not from grinding the arithmetic.",
    board: <Board typed="4" rows={4} reveal />,
    note: "Watch the error column rather than the x column — the squaring pattern is the thing to internalise.",
  },
  {
    term: "The shortcut for this game's range",
    body:
      "Because a is always drawn from 3 to 20 and x₀ is always 1, there are only three possible answers in the whole game. A bigger a puts the root further from 1, which buys exactly one more sloppy step at the start.",
    board: <Board />,
    math: ["a = 3          →   3 iterations", "a = 4 … 9      →   4 iterations", "a = 10 … 20    →   5 iterations"],
    note: "So the read is really just \"is a below 10 or not\" — and even a blind 5 is never more than two off.",
  },
];
