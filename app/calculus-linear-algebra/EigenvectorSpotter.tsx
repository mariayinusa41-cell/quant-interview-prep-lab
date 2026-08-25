"use client";

import { useMemo, useState } from "react";
import { applyMatrix, buildEigenPuzzle, isEigenvector, type Vec2 } from "./calcMath";
import { useClientRound } from "./useClientRound";
import { useWalkthrough } from "./useWalkthrough";
import CalcWalkthrough from "./CalcWalkthrough";
import { EIGEN_GUIDE } from "./walkthroughs";
import { AccessStartButton } from "../access/TokenPlayButton";

// Display-only rounding — the underlying matrix stays full-precision for
// every actual computation (see calcMath.ts for why that matters here).
function fmt(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const SCALE = 14; // px per unit, for the little arrow plot
const ORIGIN = 60;

function Arrow({ v, color, label }: { v: Vec2; color: string; label: string }) {
  const x2 = ORIGIN + v.x * SCALE;
  const y2 = ORIGIN - v.y * SCALE;
  return (
    <g>
      <line x1={ORIGIN} y1={ORIGIN} x2={x2} y2={y2} stroke={color} strokeWidth={2} markerEnd="url(#arrowhead)" />
      <text x={x2 + (v.x >= 0 ? 4 : -14)} y={y2 + (v.y >= 0 ? -4 : 12)} fill={color} fontSize={10} fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}

export default function EigenvectorSpotter() {
  const [puzzle, nextPuzzle] = useClientRound(buildEigenPuzzle);
  const guide = useWalkthrough("eigenvalues");
  const [picked, setPicked] = useState<Vec2 | null>(null);
  const [score, setScore] = useState(0);
  const [rounds, setRounds] = useState(0);

  const candidates = useMemo(() => (puzzle ? shuffle([puzzle.eigenvector, ...puzzle.decoys]) : []), [puzzle]);
  const colors = ["#5eb8ff", "#f4c542", "#b98bff", "#e74c4c"];

  if (!puzzle || guide.show === null) return <div className="calc-subgame calc-loading">Loading a fresh matrix…</div>;
  if (guide.show) return <CalcWalkthrough guide={EIGEN_GUIDE} title="Eigenvector Spotter" onDone={guide.dismiss} />;

  function pick(v: Vec2) {
    if (picked) return;
    setPicked(v);
    setRounds((r) => r + 1);
    if (v === puzzle!.eigenvector) setScore((s) => s + 1);
  }

  function next() {
    nextPuzzle();
    setPicked(null);
  }

  const pickedIsCorrect = picked !== null && picked === puzzle.eigenvector;
  const av = picked ? applyMatrix(puzzle.matrix, picked) : null;

  return (
    <div className="calc-subgame">
      <p className="calc-subgame-intro">
        One of these four directions doesn't rotate when A is applied to it — it only gets stretched or flipped.
        Click the one that stays on its own line.
      </p>
      <div className="lab-hud">
        <span>ROUND <strong>{rounds}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <button type="button" className="calc-guide-replay" onClick={guide.replay}>Walkthrough</button>
      </div>

      <div className="calc-matrix-display" aria-label="2 by 2 matrix">
        <span className="calc-matrix-bracket">[</span>
        <div className="calc-matrix-cells">
          <span>{fmt(puzzle.matrix[0][0])}</span>
          <span>{fmt(puzzle.matrix[0][1])}</span>
          <span>{fmt(puzzle.matrix[1][0])}</span>
          <span>{fmt(puzzle.matrix[1][1])}</span>
        </div>
        <span className="calc-matrix-bracket">]</span>
      </div>

      <svg viewBox="0 0 120 120" className="calc-eigen-plot" aria-hidden="true">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
          </marker>
        </defs>
        <line x1={0} y1={ORIGIN} x2={120} y2={ORIGIN} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <line x1={ORIGIN} y1={0} x2={ORIGIN} y2={120} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        {candidates.map((v, i) => (
          <Arrow key={`${v.x},${v.y}`} v={v} color={colors[i]} label={String.fromCharCode(65 + i)} />
        ))}
      </svg>

      <div className="calc-choice-grid">
        {candidates.map((v, i) => (
          <button
            type="button"
            key={`${v.x},${v.y}`}
            disabled={!!picked}
            className={
              picked === null
                ? "calc-choice"
                : v === puzzle.eigenvector
                  ? "calc-choice is-answer"
                  : v === picked
                    ? "calc-choice is-selected"
                    : "calc-choice"
            }
            onClick={() => pick(v)}
            style={{ borderColor: picked ? undefined : colors[i] }}
          >
            <span style={{ color: colors[i], fontWeight: 700, marginRight: 6 }}>{String.fromCharCode(65 + i)}</span>
            ({v.x}, {v.y})
          </button>
        ))}
      </div>

      {picked && av && (
        <div className="calc-reveal">
          <p className={pickedIsCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
            {pickedIsCorrect ? "Correct. " : "Not quite. "}
            A · ({picked.x}, {picked.y}) = ({Math.round(av.x * 100) / 100}, {Math.round(av.y * 100) / 100}).{" "}
            {isEigenvector(puzzle.matrix, picked)
              ? "That result is a scalar multiple of the input — same line, so it's an eigenvector."
              : "That result points in a different direction than the input — not an eigenvector."}
          </p>
          <AccessStartButton gameId="calculus-eigenvector-spotter" title="Eigenvector Spotter" defaultLabel="Next matrix" className="continue-btn" onStart={next}>
            Next matrix →
          </AccessStartButton>
        </div>
      )}
    </div>
  );
}
