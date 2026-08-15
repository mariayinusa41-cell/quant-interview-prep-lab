"use client";

import { useEffect, useMemo, useState } from "react";

// 8-wide x 10-tall pixel-art pirate bust — same grid used across this puzzle.
const PIRATE_GRID = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [3, 2, 3, 2, 2, 4, 2, 3],
  [3, 2, 2, 2, 2, 2, 2, 3],
  [0, 3, 2, 2, 2, 2, 3, 0],
  [0, 0, 5, 5, 5, 5, 0, 0],
  [0, 5, 5, 6, 6, 5, 5, 0],
  [0, 5, 5, 5, 5, 5, 5, 0],
];

const PIRATE_LOOKS: Record<number, { hat: string; body: string; skin: string }> = {
  1: { hat: "#b98bff", body: "#5a3b8f", skin: "#f0c8a0" },
  2: { hat: "#59c98f", body: "#1f6b48", skin: "#8d5524" },
  3: { hat: "#4fb3e0", body: "#1c5a78", skin: "#e3b287" },
  4: { hat: "#f0a53b", body: "#7a4a12", skin: "#3d2317" },
  5: { hat: "#e74c4c", body: "#7a2323", skin: "#6b4226" },
  6: { hat: "#2fd4c4", body: "#12615a", skin: "#c98f5e" },
};

function PixelPirateIcon({ pirateNumber, senior }: { pirateNumber: number; senior: boolean }) {
  const look = PIRATE_LOOKS[pirateNumber] ?? PIRATE_LOOKS[1];
  const outline = "#1a1410";
  const eye = "#f4f0e8";
  const gold = "#f4c542";

  const colorFor = (code: number) => {
    switch (code) {
      case 1:
        return look.hat;
      case 2:
        return look.skin;
      case 3:
        return outline;
      case 4:
        return eye;
      case 5:
        return look.body;
      case 6:
        return senior ? gold : look.body;
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 8 10" className="pixel-pirate-svg breakdown-pirate-icon" shapeRendering="crispEdges">
      {PIRATE_GRID.map((row, y) =>
        row.map((code, x) => {
          const fill = colorFor(code);
          if (!fill) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        })
      )}
    </svg>
  );
}

const MAX_CREW = 6;

type Step = {
  k: number;
  result: Record<number, number>;
  bribed: number[];
  votesNeeded: number;
};

// The same exact recursion used to grade the answer page, walked forward one
// crew size at a time so each step can explain itself using the step before it.
function buildSteps(maxK: number): Step[] {
  const steps: Step[] = [{ k: 1, result: { 1: 100 }, bribed: [], votesNeeded: 0 }];
  let prev = steps[0].result;
  for (let k = 2; k <= maxK; k++) {
    const votesNeeded = Math.ceil(k / 2) - 1;
    const zeroGetters = Object.keys(prev)
      .map(Number)
      .sort((a, b) => a - b)
      .filter((p) => prev[p] === 0);
    const bribed = zeroGetters.slice(0, votesNeeded);
    const current: Record<number, number> = { [k]: 100 - bribed.length };
    for (let p = 1; p < k; p++) current[p] = bribed.includes(p) ? 1 : 0;
    steps.push({ k, result: current, bribed, votesNeeded });
    prev = current;
  }
  return steps;
}

function listPirates(nums: number[]): string {
  const names = nums.map((n) => `Pirate ${n}`);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function captionFor(step: Step): string {
  const { k, bribed, votesNeeded } = step;
  if (k === 1) return "Alone, Pirate 1 needs no one's vote but his own. He keeps all 100 coins.";
  if (votesNeeded === 0) {
    return `Pirate ${k} only needs 50% of the vote, and his own vote already clears that. He keeps all 100 — Pirate ${
      k - 1
    } gets nothing.`;
  }
  const pluralVotes = votesNeeded > 1 ? "votes" : "vote";
  const pluralPronoun = bribed.length > 1 ? "their" : "his";
  return `Pirate ${k} needs ${votesNeeded} more ${pluralVotes} besides his own. If this plan fails, ${listPirates(
    bribed
  )} would get nothing next round — so 1 coin each is enough to buy ${pluralPronoun} yes.`;
}

const STEP_HOLD_MS = 4600;

export default function BreakdownStory() {
  const steps = useMemo(() => buildSteps(MAX_CREW), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const step = steps[stepIndex];
  const pirateOrder = useMemo(() => Array.from({ length: step.k }, (_, i) => step.k - i), [step.k]);
  const isLastStep = stepIndex === steps.length - 1;

  // Numbers pop in a beat after the pirates themselves appear.
  useEffect(() => {
    setRevealed(false);
    const t = window.setTimeout(() => setRevealed(true), 500);
    return () => window.clearTimeout(t);
  }, [stepIndex]);

  // Auto-advance, unless we're on the final step.
  useEffect(() => {
    if (isLastStep) return;
    const t = window.setTimeout(() => setStepIndex((i) => Math.min(i + 1, steps.length - 1)), STEP_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [stepIndex, isLastStep, steps.length]);

  return (
    <div className="pirate-stage-content breakdown-content">
      <p className="pirate-kicker">Screwy Pirates</p>

      <div className="breakdown-progress">
        {steps.map((s, i) => (
          <button
            key={s.k}
            type="button"
            className={i === stepIndex ? "breakdown-dot is-active" : "breakdown-dot"}
            aria-label={`Jump to ${s.k} pirate${s.k > 1 ? "s" : ""}`}
            onClick={() => setStepIndex(i)}
          />
        ))}
      </div>

      <p key={stepIndex} className="pirate-story-line pirate-enter breakdown-caption" style={{ animationDelay: "0s" }}>
        {captionFor(step)}
      </p>

      <div className="breakdown-lineup">
        {pirateOrder.map((pirateNumber, i) => {
          const isSenior = pirateNumber === step.k;
          const isBribed = step.bribed.includes(pirateNumber);
          const amount = step.result[pirateNumber];
          return (
            <div className="breakdown-slot pirate-enter" style={{ animationDelay: `${i * 0.1}s` }} key={pirateNumber}>
              {isSenior && <span className="proposal-badge">★</span>}
              <PixelPirateIcon pirateNumber={pirateNumber} senior={isSenior} />
              <p className="pirate-label">Pirate {pirateNumber}</p>
              <span
                className={
                  isSenior
                    ? "breakdown-amount is-senior"
                    : isBribed
                      ? "breakdown-amount is-bribed"
                      : "breakdown-amount is-zero"
                }
                style={{ opacity: revealed ? 1 : 0 }}
              >
                {amount}
              </span>
            </div>
          );
        })}
      </div>

      {isLastStep && (
        <div className="breakdown-formula">
          <p className="pirate-story-line">The pattern, for any crew size n:</p>
          <code className="breakdown-code">keep(n) = 100 − floor((n − 1) / 2)</code>
          <button type="button" className="chip-btn" onClick={() => setStepIndex(0)}>
            Watch it again from n = 1
          </button>
        </div>
      )}
    </div>
  );
}
