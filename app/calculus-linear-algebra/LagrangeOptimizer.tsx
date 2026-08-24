"use client";

import { useEffect, useState } from "react";
import { lagrangeObjective, lagrangeOptimum, randomLagrangeProblem } from "./calcMath";
import { useClientRound } from "./useClientRound";
import { AccessStartButton } from "../access/TokenPlayButton";

function scoreFromRatio(ratio: number): { points: number; label: string } {
  if (ratio >= 0.99) return { points: 3, label: "Right at the optimum" };
  if (ratio >= 0.95) return { points: 2, label: "Very close" };
  if (ratio >= 0.85) return { points: 1, label: "In the neighborhood" };
  return { points: 0, label: "Off the optimum" };
}

export default function LagrangeOptimizer() {
  const [problem, nextProblem] = useClientRound(randomLagrangeProblem);
  const [x, setX] = useState(0);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  // Re-center the slider off the optimum (so it's not a free giveaway)
  // every time a new problem loads, including the very first one.
  useEffect(() => {
    if (problem) {
      setX(Math.round((problem.k / 2 - 2) * 10) / 10);
      setLocked(false);
    }
  }, [problem]);

  if (!problem) return <div className="calc-subgame calc-loading">Loading a fresh constraint…</div>;

  const value = lagrangeObjective(x, problem.k);
  const { xStar, value: bestValue } = lagrangeOptimum(problem.k);
  const ratio = bestValue > 0 ? Math.max(0, value) / bestValue : 1;

  function lockIn() {
    if (locked) return;
    setLocked(true);
    setRounds((r) => r + 1);
    setScore((s) => s + scoreFromRatio(ratio).points);
  }

  function next() {
    nextProblem(); // the useEffect above re-centers x and clears `locked`
  }

  const result = locked ? scoreFromRatio(ratio) : null;

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Slide x to maximize x · (k − x) subject to x + y = k, y ≥ 0. Explore freely, then lock in your best guess —
        no formula needed until the reveal.
      </p>
      <div className="lab-hud">
        <span>ROUND <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
      </div>

      <div className="calc-taylor-panel">
        <p className="calc-taylor-target">
          Maximize x(k − x) with x + y = <strong>{problem.k}</strong>, x, y ≥ 0
        </p>

        <div className="calc-slider-row">
          <span className="calc-slider-label">x</span>
          <input
            type="range"
            min={0}
            max={problem.k}
            step={0.1}
            value={x}
            disabled={locked}
            onChange={(e) => setX(Number(e.target.value))}
            className="calc-slider"
          />
          <span className="calc-slider-value">{x.toFixed(1)}</span>
        </div>

        <div className="calc-taylor-readout">
          <div>
            <span className="calc-comp-label">x</span>
            <span className="calc-comp-val">{x.toFixed(1)}</span>
          </div>
          <div>
            <span className="calc-comp-label">y = k − x</span>
            <span className="calc-comp-val">{(problem.k - x).toFixed(1)}</span>
          </div>
          <div>
            <span className="calc-comp-label">x · y</span>
            <span className="calc-comp-val">{value.toFixed(2)}</span>
          </div>
        </div>

        {!locked ? (
          <button type="button" className="continue-btn" onClick={lockIn}>Lock in x = {x.toFixed(1)}</button>
        ) : (
          <div className="calc-reveal">
            <p className={result && result.points >= 2 ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
              {result?.label} (+{result?.points} pts). ∇f = λ∇g gives y = x here, so the true optimum is x = y ={" "}
              {xStar.toFixed(1)}, product = {bestValue.toFixed(2)}. You reached {(ratio * 100).toFixed(0)}% of the
              maximum.
            </p>
            <AccessStartButton gameId="calculus-lagrange-optimizer" title="Lagrange Optimizer" defaultLabel="Next round" className="continue-btn" onStart={next}>
              Next round →
            </AccessStartButton>
          </div>
        )}
      </div>
    </div>
  );
}
