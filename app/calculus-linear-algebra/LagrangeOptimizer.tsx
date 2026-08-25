"use client";

import { useState } from "react";
import { lagrangeSolution, randomLagrangeProblem } from "./calcMath";
import { useClientRound } from "./useClientRound";
import { useWalkthrough } from "./useWalkthrough";
import CalcWalkthrough from "./CalcWalkthrough";
import { LAGRANGE_DEMO } from "./demos/LagrangeDemo";
import { AccessStartButton } from "../access/TokenPlayButton";

function parseAnswer(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function LagrangeOptimizer() {
  const [problem, nextProblem] = useClientRound(randomLagrangeProblem);
  const guide = useWalkthrough("lagrange");
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  if (!problem || guide.show === null) return <div className="calc-subgame calc-loading">Loading a fresh constraint…</div>;
  if (guide.show) return <CalcWalkthrough steps={LAGRANGE_DEMO} title="Lagrange Optimizer" onDone={guide.dismiss} />;

  const solution = lagrangeSolution(problem);
  const guess = parseAnswer(answer);
  const tolerance = Math.max(0.01, Math.abs(solution.xStar) * 0.01);
  // Raw correctness doesn't depend on `checked` — it has to be evaluable
  // the instant `check()` runs, before that state update has landed. Gating
  // it on `checked` (so it reads false inside the same click that just set
  // `checked`) was the actual bug: score never incremented on a right
  // answer because this closure still saw the pre-click `checked === false`.
  const rawCorrect = guess !== null && Math.abs(guess - solution.xStar) <= tolerance;
  const isCorrect = checked && rawCorrect;

  function check() {
    if (checked || guess === null) return;
    setChecked(true);
    setRounds((r) => r + 1);
    if (rawCorrect) setScore((s) => s + 1);
  }

  function next() {
    nextProblem();
    setAnswer("");
    setChecked(false);
  }

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Solve the actual Lagrange condition — ∇f = λ∇g — for x*. No live objective value to chase toward; work the
        algebra, then type the number.
      </p>
      <div className="lab-hud">
        <span>ROUND <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <button type="button" className="calc-guide-replay" onClick={guide.replay}>Walkthrough</button>
      </div>

      <div className="calc-taylor-panel">
        <p className="calc-taylor-target">
          Maximize f(x, y) = xy subject to {problem.a}x + {problem.b}y = <strong>{problem.k}</strong>, x, y ≥ 0. What
          is x* at the optimum?
        </p>
        <p className="mm-step-hint" style={{ marginBottom: 10 }}>
          ∇f = (y, x), ∇g = ({problem.a}, {problem.b}). Setting ∇f = λ∇g gives y = λ{problem.a}, x = λ{problem.b} —
          substitute both into the constraint to solve for λ, then x*.
        </p>

        <div className="quiz-q-input-row">
          <input
            type="text"
            className="quiz-q-input"
            placeholder="type x*"
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
              {isCorrect ? "✓ Correct. " : `✗ Not quite — x* = ${solution.xStar.toFixed(3)}. `}
              λ = k / (2ab) = {problem.k} / (2·{problem.a}·{problem.b}) = {solution.lambda.toFixed(3)}, so x* = λ
              {problem.b} = {solution.xStar.toFixed(3)} and y* = λ{problem.a} = {solution.yStar.toFixed(3)}. Check:{" "}
              {problem.a}({solution.xStar.toFixed(2)}) + {problem.b}({solution.yStar.toFixed(2)}) ≈ {problem.k}, and
              the maximum value of xy is {solution.value.toFixed(3)}.
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
