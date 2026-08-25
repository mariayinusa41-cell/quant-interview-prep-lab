"use client";

import { useState } from "react";
import { classifyPSD, randomPSDMatrix, type PSDLabel } from "./calcMath";
import { useClientRound } from "./useClientRound";
import { useWalkthrough } from "./useWalkthrough";
import CalcWalkthrough from "./CalcWalkthrough";
import { PSD_DEMO } from "./demos/PSDDemo";
import { AccessStartButton } from "../access/TokenPlayButton";
import { useProgress } from "../progress/ProgressContext";
import { useSound } from "../audio/SoundProvider";

const LABELS: PSDLabel[] = ["Positive definite", "Positive semidefinite", "Indefinite", "Negative definite"];

export default function PSDClassifier() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();
  const [matrix, nextMatrix] = useClientRound(randomPSDMatrix);
  const guide = useWalkthrough("psd-matrices");
  const [picked, setPicked] = useState<PSDLabel | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [streak, setStreak] = useState(0);

  if (!matrix || guide.show === null) return <div className="calc-subgame calc-loading">Loading a fresh matrix…</div>;
  if (guide.show) return <CalcWalkthrough steps={PSD_DEMO} title="PSD Classifier" onDone={guide.dismiss} />;

  const truth = classifyPSD(matrix);
  const det = matrix.a * matrix.c - matrix.b * matrix.b;
  const trace = matrix.a + matrix.c;

  function pick(label: PSDLabel) {
    if (picked) return;
    setPicked(label);
    setRounds((r) => r + 1);
    recordAttempt("linear-algebra", label === truth ? "correct" : "incorrect");
    playSfx(label === truth ? "correct" : "wrong");
    if (label === truth) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }

  function next() {
    nextMatrix();
    setPicked(null);
    // Switching to the busier in-game loop is also a user gesture, so this
    // is a safe point to (re)start audio if it was never kicked off.
    startMusic("game");
  }

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        Classify the symmetric matrix Σ = [[a, b], [b, c]] by whether xᵀΣx is always nonnegative — the test that
        decides whether something can be a real covariance matrix.
      </p>
      <div className="lab-hud">
        <span>ROUND <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <span>STREAK <strong>{streak}</strong></span>
        <button type="button" className="calc-guide-replay" onClick={guide.replay}>Walkthrough</button>
      </div>

      <div className="calc-matrix-display" aria-label="2 by 2 matrix">
        <span className="calc-matrix-bracket">[</span>
        <div className="calc-matrix-cells">
          <span>{matrix.a}</span>
          <span>{matrix.b}</span>
          <span>{matrix.b}</span>
          <span>{matrix.c}</span>
        </div>
        <span className="calc-matrix-bracket">]</span>
      </div>

      <div className="calc-choice-grid">
        {LABELS.map((label) => (
          <button
            type="button"
            key={label}
            disabled={!!picked}
            className={
              picked === null
                ? "calc-choice"
                : label === truth
                  ? "calc-choice is-answer"
                  : label === picked
                    ? "calc-choice is-selected"
                    : "calc-choice"
            }
            onClick={() => pick(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {picked && (
        <div className="calc-reveal">
          <p className={picked === truth ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
            {picked === truth ? "Correct. " : "Not quite. "}
            trace = a + c = {trace}, det = ac − b² = {det}.{" "}
            {det < 0
              ? "A negative determinant means the eigenvalues have opposite signs — indefinite."
              : trace > 0
                ? det === 0
                  ? "Positive trace with a zero determinant means one eigenvalue is exactly 0 — semidefinite, not strictly definite."
                  : "Positive trace and positive determinant means both eigenvalues are positive — definite."
                : trace < 0
                  ? "Negative trace with nonnegative determinant means both eigenvalues are negative."
                  : "Zero trace with zero determinant only stays PSD if b is also 0."}
          </p>
          <AccessStartButton gameId="calculus-psd-classifier" title="PSD Classifier" defaultLabel="Next matrix" className="continue-btn" onStart={next}>
            Next matrix →
          </AccessStartButton>
        </div>
      )}
    </div>
  );
}
