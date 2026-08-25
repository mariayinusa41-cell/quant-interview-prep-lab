"use client";

import type { DemoStep } from "../CalcWalkthrough";

// A played round of PSD Classifier, then a replay on the matrix that catches
// people. Numbers checked against calcMath's classifyPSD:
//   [[4,1],[1,3]]  trace 7,  det 11  → Positive definite
//   [[1,3],[3,1]]  trace 2,  det −8  → Indefinite

const LABELS = ["Positive definite", "Positive semidefinite", "Indefinite", "Negative definite"];

function Board({
  a,
  b,
  c,
  answer,
  considering,
}: {
  a: number;
  b: number;
  c: number;
  answer?: string;
  considering?: string;
}) {
  return (
    <>
      <div className="calc-matrix-display" aria-label="2 by 2 matrix">
        <span className="calc-matrix-bracket">[</span>
        <div className="calc-matrix-cells">
          <span>{a}</span>
          <span>{b}</span>
          <span>{b}</span>
          <span>{c}</span>
        </div>
        <span className="calc-matrix-bracket">]</span>
      </div>
      <div className="calc-choice-grid">
        {LABELS.map((label) => {
          const cls = [
            "calc-choice",
            answer === label ? "is-answer" : "",
            considering === label ? "is-demo-testing" : "",
            answer && answer !== label ? "is-demo-out" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button type="button" key={label} className={cls} disabled aria-disabled="true">
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export const PSD_DEMO: DemoStep[] = [
  {
    term: "This is the board",
    body:
      "A symmetric matrix and four labels. The question underneath is whether xᵀΣx can ever go negative - which is the same as asking whether this could be a real covariance matrix. One click, no typing.",
    board: <Board a={4} b={1} c={3} />,
    note: "Note it's symmetric: the off-diagonal b appears twice. Only three distinct numbers matter.",
  },
  {
    term: "Pull the two numbers that decide it",
    body:
      "I never compute the eigenvalues themselves. Their sum is the trace and their product is the determinant, and both come off the matrix in one step each. Those two facts are enough to pin down the sign of both eigenvalues.",
    board: <Board a={4} b={1} c={3} />,
    math: ["trace  =  a + c    =  4 + 3      =  7", "det    =  ac − b²  =  4·3 − 1²  =  11"],
    note: "trace = λ₁ + λ₂ and det = λ₁·λ₂ - that's why these two are sufficient.",
  },
  {
    term: "Read the sign of the determinant first",
    body:
      "det is positive, so the eigenvalues have the same sign - that alone rules out Indefinite. Then the trace is positive, so the sign they share is positive. Both eigenvalues are strictly positive, and det isn't zero, so nothing is sitting on the semidefinite boundary.",
    board: <Board a={4} b={1} c={3} considering="Positive definite" />,
    math: [
      "det = 11 > 0        →  same sign, not Indefinite",
      "trace = 7 > 0       →  both positive",
      "det ≠ 0             →  not on the semidefinite edge",
    ],
  },
  {
    term: "Click Positive definite",
    body: "That's the round. The reveal restates the two numbers and the rule that decided it, so you can check your reasoning against it rather than just your answer.",
    board: <Board a={4} b={1} c={3} answer="Positive definite" />,
    note: "Correct - positive trace with a positive determinant means both eigenvalues are positive.",
  },
  {
    term: "Now the one that catches people",
    body:
      "Fresh matrix. The diagonal is positive and it looks harmless, so the instinct is to click Positive definite again. Run the numbers before you do - the off-diagonal is doing damage here.",
    board: <Board a={1} b={3} c={1} />,
    math: ["trace  =  1 + 1        =  2      (positive)", "det    =  1·1 − 3²     =  −8    (negative)"],
    note: "A negative determinant means the eigenvalues have opposite signs, whatever the diagonal looks like.",
  },
  {
    term: "So this one is Indefinite",
    body:
      "det < 0 settles it before the trace is even worth reading. A large off-diagonal relative to the diagonal always breaks positivity - in covariance terms this matrix is claiming a correlation above 1, which no real data can produce.",
    board: <Board a={1} b={3} c={1} answer="Indefinite" />,
    note:
      "That's why interviews ask: every covariance matrix is PSD, and PSD is also what makes a portfolio optimisation convex.",
  },
];
