"use client";

import { useState } from "react";
import { TAYLOR_FUNCTIONS, minOrderForError, taylorApprox, taylorError, type TaylorFn } from "./calcMath";
import { useClientRound } from "./useClientRound";
import { AccessStartButton } from "../access/TokenPlayButton";

const MAX_ORDER = 8;
const THRESHOLDS = [0.1, 0.01, 0.001];
const ORDERS = [2, 3, 4]; // kept low enough to sum by hand in one round

function randomX(fn: TaylorFn): number {
  if (fn.name === "ln(1+x)") {
    // The Maclaurin series for ln(1 + x) only converges on -1 < x ≤ 1 — the
    // old list included 1.2 and 1.6, both outside that radius, where no
    // number of terms ever gets closer to the true value (the series
    // diverges there). Every sample point below is inside the actual
    // interval of convergence.
    const options = [-0.9, -0.6, -0.4, 0.5, 0.8, 0.95];
    return options[Math.floor(Math.random() * options.length)];
  }
  const options = [-1.8, -1.3, -0.8, 0.6, 1.1, 1.5, 1.9];
  return options[Math.floor(Math.random() * options.length)];
}

type Round = { fn: TaylorFn; x: number; order: number; threshold: number };

function newRound(): Round {
  const fn = TAYLOR_FUNCTIONS[Math.floor(Math.random() * TAYLOR_FUNCTIONS.length)];
  const x = randomX(fn);
  const order = ORDERS[Math.floor(Math.random() * ORDERS.length)];
  const threshold = THRESHOLDS[Math.floor(Math.random() * THRESHOLDS.length)];
  return { fn, x, order, threshold };
}

function parseAnswer(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function TaylorSlider() {
  const [round, nextRound] = useClientRound(newRound);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  if (!round) return <div className="calc-subgame calc-loading">Loading a fresh function…</div>;

  const trueApprox = taylorApprox(round.fn, round.x, round.order);
  const trueValue = round.fn.f(round.x);
  const error = taylorError(round.fn, round.x, round.order);
  const trueMin = minOrderForError(round.fn, round.x, round.threshold, MAX_ORDER);
  const guess = parseAnswer(answer);
  // Tolerance scales with the size of the true value — 0.5% of it, floored
  // so tiny values near zero aren't impossibly strict.
  const tolerance = Math.max(0.01, Math.abs(trueApprox) * 0.005);
  // Same fix as LagrangeOptimizer.tsx: correctness has to not depend on
  // `checked` so it's readable inside the click that's about to set it.
  const rawCorrect = guess !== null && Math.abs(guess - trueApprox) <= tolerance;
  const isCorrect = checked && rawCorrect;

  function check() {
    if (checked || guess === null) return;
    setChecked(true);
    setRounds((r) => r + 1);
    if (rawCorrect) setScore((s) => s + 1);
  }

  function next() {
    nextRound();
    setAnswer("");
    setChecked(false);
  }

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Build the Taylor polynomial by hand — sum the terms up to the given order and type the number. No live
        readout to chase; you have to actually compute it before you find out if you're right.
      </p>
      <div className="lab-hud">
        <span>ROUND <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
      </div>

      <div className="calc-taylor-panel">
        <p className="calc-taylor-target">
          Compute the order-<strong>{round.order}</strong> Taylor approximation of <strong>{round.fn.label}</strong>{" "}
          at x = {round.x}
        </p>
        <p className="mm-step-hint" style={{ marginBottom: 10 }}>
          Σ (term k, k = 0…{round.order}) — for {round.fn.label}, term k is the k-th derivative's contribution at x
          = {round.x}.
        </p>

        <div className="quiz-q-input-row">
          <input
            type="text"
            className="quiz-q-input"
            placeholder="type your approximation"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={checked}
          />
        </div>

        {!checked ? (
          <button type="button" className="continue-btn" disabled={guess === null} onClick={check} style={{ marginTop: 10 }}>
            Check
          </button>
        ) : (
          <div className="calc-reveal">
            <p className={isCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
              {isCorrect ? "✓ Correct. " : `✗ Not quite — the order-${round.order} sum is ${trueApprox.toFixed(5)}. `}
              True value of {round.fn.label} at x = {round.x} is {trueValue.toFixed(5)}, so this order's error is{" "}
              {error.toExponential(2)}.{" "}
              {trueMin === null
                ? `Even order ${MAX_ORDER} can't clear an error of ${round.threshold} here.`
                : trueMin <= round.order
                  ? `That's already enough to clear an error target of ${round.threshold} (order ${trueMin} is the smallest that does).`
                  : `To clear an error target of ${round.threshold} here you'd need order ${trueMin}, not ${round.order}.`}
            </p>
            <AccessStartButton gameId="calculus-taylor-slider" title="Taylor Slider" defaultLabel="Next round" className="continue-btn" onStart={next}>
              Next round →
            </AccessStartButton>
          </div>
        )}
      </div>
    </div>
  );
}
