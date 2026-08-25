"use client";

import { useState } from "react";
import { newtonStep, randomNewtonProblem } from "./calcMath";
import { useClientRound } from "./useClientRound";
import { useWalkthrough } from "./useWalkthrough";
import CalcWalkthrough from "./CalcWalkthrough";
import { NEWTON_DEMO } from "./demos/NewtonDemo";
import { AccessStartButton } from "../access/TokenPlayButton";

const TOLERANCE = 1e-4;
const START_X = 1; // fixed, deliberately far-ish from every root in range so convergence speed varies meaningfully

function runSteps(a: number, root: number, maxSteps = 20) {
  const steps: { n: number; x: number; error: number }[] = [];
  let x = START_X;
  for (let n = 1; n <= maxSteps; n++) {
    x = newtonStep(a, x);
    const error = Math.abs(x - root);
    steps.push({ n, x, error });
    if (error <= TOLERANCE) break;
  }
  return steps;
}

function scoreFromDiff(diff: number): number {
  if (diff === 0) return 3;
  if (diff === 1) return 2;
  if (diff <= 2) return 1;
  return 0;
}

export default function NewtonStepper() {
  const [problem, nextProblem] = useClientRound(randomNewtonProblem);
  const guide = useWalkthrough("newton");
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  if (!problem || guide.show === null) return <div className="calc-subgame calc-loading">Loading a fresh root…</div>;
  if (guide.show) return <CalcWalkthrough steps={NEWTON_DEMO} title="Newton Stepper" onDone={guide.dismiss} />;

  const steps = revealed ? runSteps(problem.a, problem.root) : [];
  const actualCount = steps.length;
  const guessNum = Number(guess);
  const diff = revealed && !isNaN(guessNum) ? Math.abs(guessNum - actualCount) : null;
  const points = diff !== null ? scoreFromDiff(diff) : null;

  // `points` is derived from `revealed`, which this function itself flips —
  // so it recomputes the step count and diff locally rather than trusting
  // the pre-reveal render's closure over `points`.
  function revealAndScore() {
    if (revealed || guess.trim() === "") return;
    const stepsNow = runSteps(problem!.a, problem!.root);
    const g = Number(guess);
    const d = isNaN(g) ? Infinity : Math.abs(g - stepsNow.length);
    setRevealed(true);
    setRounds((r) => r + 1);
    setScore((s) => s + scoreFromDiff(d));
  }

  function next() {
    nextProblem();
    setGuess("");
    setRevealed(false);
  }

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Newton's method roots: x<sub>n+1</sub> = x<sub>n</sub> − f(x<sub>n</sub>)/f&apos;(x<sub>n</sub>). Estimate how
        many iterations from x₀ = {START_X} it takes to land within {TOLERANCE} of the true root - before you see a
        single step.
      </p>
      <div className="lab-hud">
        <span>ROUND <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <button type="button" className="calc-guide-replay" onClick={guide.replay}>Walkthrough</button>
      </div>

      <div className="calc-taylor-panel">
        <p className="calc-taylor-target">
          Solve <strong>{problem.label}</strong> from x₀ = {START_X}
        </p>

        {!revealed ? (
          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Number of iterations (e.g. 4)"
              autoComplete="off"
              inputMode="numeric"
            />
            <button type="button" className="calc-submit-btn" onClick={revealAndScore}>Run it</button>
          </div>
        ) : (
          <div className="calc-reveal">
            <p className={points !== null && points >= 2 ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
              True root ≈ {problem.root.toFixed(5)}. It took <strong>{actualCount}</strong> iterations to get within{" "}
              {TOLERANCE}. You guessed {guess} (+{points} pts).
            </p>
            <div className="calc-newton-table">
              {steps.map((s) => (
                <div key={s.n} className="calc-newton-row">
                  <span>n={s.n}</span>
                  <span>x = {s.x.toFixed(6)}</span>
                  <span>|error| = {s.error.toExponential(2)}</span>
                </div>
              ))}
            </div>
            <AccessStartButton gameId="calculus-newton-stepper" title="Newton Stepper" defaultLabel="Next root" className="continue-btn" onStart={next}>
              Next root →
            </AccessStartButton>
          </div>
        )}
      </div>
    </div>
  );
}
