"use client";

import { useMemo, useState } from "react";
import { TAYLOR_FUNCTIONS, minOrderForError, taylorApprox, taylorError, type TaylorFn } from "./calcMath";
import { useClientRound } from "./useClientRound";
import { AccessStartButton } from "../access/TokenPlayButton";

const MAX_ORDER = 8;
const THRESHOLDS = [0.1, 0.01, 0.001];

function randomX(fn: TaylorFn): number {
  if (fn.name === "ln(1+x)") {
    // domain x > -1; keep away from the singularity and from 0
    const options = [-0.6, -0.4, 0.5, 0.8, 1.2, 1.6];
    return options[Math.floor(Math.random() * options.length)];
  }
  const options = [-1.8, -1.3, -0.8, 0.6, 1.1, 1.5, 1.9];
  return options[Math.floor(Math.random() * options.length)];
}

type Round = { fn: TaylorFn; x: number; threshold: number };

function newRound(): Round {
  const fn = TAYLOR_FUNCTIONS[Math.floor(Math.random() * TAYLOR_FUNCTIONS.length)];
  const x = randomX(fn);
  const threshold = THRESHOLDS[Math.floor(Math.random() * THRESHOLDS.length)];
  return { fn, x, threshold };
}

export default function TaylorSlider() {
  const [round, nextRound] = useClientRound(newRound);
  const [order, setOrder] = useState(2);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  const trueMin = useMemo(
    () => (round ? minOrderForError(round.fn, round.x, round.threshold, MAX_ORDER) : null),
    [round]
  );

  if (!round) return <div className="calc-subgame calc-loading">Loading a fresh function…</div>;

  const approx = taylorApprox(round.fn, round.x, order);
  const error = taylorError(round.fn, round.x, order);
  const meetsThreshold = error <= round.threshold;

  function lockIn() {
    if (locked) return;
    setLocked(true);
    setRounds((r) => r + 1);
    if (trueMin !== null && order === trueMin) setScore((s) => s + 1);
  }

  function next() {
    nextRound();
    setOrder(2);
    setLocked(false);
  }

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Drag the order slider until the Taylor approximation just barely clears the error target, then lock in the
        <strong> smallest</strong> order that does it — same move as picking how many terms to keep in an interview.
      </p>
      <div className="lab-hud">
        <span>ROUND <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
      </div>

      <div className="calc-taylor-panel">
        <p className="calc-taylor-target">
          Approximate <strong>{round.fn.label}</strong> at x = {round.x} to error ≤ <strong>{round.threshold}</strong>
        </p>

        <div className="calc-slider-row">
          <span className="calc-slider-label">Order</span>
          <input
            type="range"
            min={0}
            max={MAX_ORDER}
            step={1}
            value={order}
            disabled={locked}
            onChange={(e) => setOrder(Number(e.target.value))}
            className="calc-slider"
          />
          <span className="calc-slider-value">{order}</span>
        </div>

        <div className="calc-taylor-readout">
          <div>
            <span className="calc-comp-label">Approximation</span>
            <span className="calc-comp-val">{approx.toFixed(5)}</span>
          </div>
          <div>
            <span className="calc-comp-label">True value</span>
            <span className="calc-comp-val">{round.fn.f(round.x).toFixed(5)}</span>
          </div>
          <div>
            <span className="calc-comp-label">Error</span>
            <span className={meetsThreshold ? "calc-comp-val is-good" : "calc-comp-val is-bad"}>
              {error.toExponential(2)}
            </span>
          </div>
        </div>

        <div className={meetsThreshold ? "calc-threshold-badge is-good" : "calc-threshold-badge is-bad"}>
          {meetsThreshold ? "Under target ✓" : "Over target — add more terms"}
        </div>

        {!locked ? (
          <button type="button" className="continue-btn" onClick={lockIn}>Lock in order {order}</button>
        ) : (
          <div className="calc-reveal">
            <p className={trueMin !== null && order === trueMin ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
              {trueMin === null
                ? `Even order ${MAX_ORDER} can't clear that target here — this pushes past where a Taylor series is a practical tool.`
                : order === trueMin
                  ? `Correct — order ${trueMin} is the smallest that clears ${round.threshold}.`
                  : order < trueMin
                    ? `Not quite — order ${order} doesn't clear the target yet; the smallest that does is order ${trueMin}.`
                    : `Close, but order ${trueMin} already clears it — order ${order} adds unnecessary terms.`}
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
