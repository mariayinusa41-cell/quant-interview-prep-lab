"use client";

import type { DemoStep } from "../CalcWalkthrough";

// A played round of Eigenvector Spotter on a fixed matrix, using the same
// board markup the live game renders. Every number below is the real result
// of applying A — checked against calcMath's applyMatrix/isEigenvector.
//
//   A = [[3, 1], [0, 2]]
//   A·(1,1)  = (4, 2)   cross =  4·1 − 2·1 =  2   → rotated
//   A·(2,-1) = (5, −2)  cross =  5·(−1) − (−2)·2 = −1  → rotated
//   A·(1,0)  = (3, 0)   cross =  3·0 − 0·1 =  0   → EIGENVECTOR (λ = 3)
//   A·(1,2)  = (5, 4)   cross =  5·2 − 4·1 =  6   → rotated

const MATRIX: [[number, number], [number, number]] = [
  [3, 1],
  [0, 2],
];

type Candidate = { label: string; x: number; y: number; color: string };

// Fixed order, with the answer third — a demo where the first guess is right
// teaches nothing about searching.
const CANDIDATES: Candidate[] = [
  { label: "A", x: 1, y: 1, color: "#5eb8ff" },
  { label: "B", x: 2, y: -1, color: "#f4c542" },
  { label: "C", x: 1, y: 0, color: "#b98bff" },
  { label: "D", x: 1, y: 2, color: "#e74c4c" },
];

const ANSWER = "C";

// The live board uses a 120-unit box, but it only ever draws the candidates.
// This one also draws each candidate's image under A, whose components reach
// 5 — so the box is scaled up to keep A·v on screen instead of clipping the
// exact arrow the step is talking about.
const SCALE = 18;
const ORIGIN = 100;
const BOX = 200;
const IMAGE_COLOR = "#47f0c2";

function Arrow({ c, dim, lit }: { c: Candidate; dim: boolean; lit: boolean }) {
  const x2 = ORIGIN + c.x * SCALE;
  const y2 = ORIGIN - c.y * SCALE;
  return (
    <g opacity={dim ? 0.18 : 1}>
      <line
        x1={ORIGIN}
        y1={ORIGIN}
        x2={x2}
        y2={y2}
        stroke={c.color}
        strokeWidth={lit ? 3 : 2}
        markerEnd={`url(#demo-head-${c.label})`}
      />
      <text
        x={x2 + (c.x >= 0 ? 6 : -16)}
        y={y2 + (c.y >= 0 ? -6 : 14)}
        fill={c.color}
        fontSize={13}
        fontWeight={700}
        fontFamily="monospace"
      >
        {c.label}
      </text>
    </g>
  );
}

// The image of whichever vector is under test, drawn dashed so you can SEE
// whether it landed back on the same line or swung off it. This is the whole
// point of the game and the live board only implies it in text.
function ImageArrow({ c }: { c: Candidate }) {
  const av = { x: MATRIX[0][0] * c.x + MATRIX[0][1] * c.y, y: MATRIX[1][0] * c.x + MATRIX[1][1] * c.y };
  const x2 = ORIGIN + av.x * SCALE;
  const y2 = ORIGIN - av.y * SCALE;
  return (
    <g>
      <line
        x1={ORIGIN}
        y1={ORIGIN}
        x2={x2}
        y2={y2}
        stroke={IMAGE_COLOR}
        strokeWidth={2}
        strokeDasharray="5 4"
        markerEnd="url(#demo-head-av)"
      />
      <text x={x2 + 6} y={y2 - 6} fill={IMAGE_COLOR} fontSize={12} fontWeight={700} fontFamily="monospace">
        A·v
      </text>
    </g>
  );
}

// One marker per colour: an SVG marker can't inherit its line's stroke
// without context-stroke, which isn't safe to rely on, and a single
// currentColor marker renders every head the same white — exactly the
// ambiguity this plot exists to remove.
function ArrowHeads() {
  return (
    <defs>
      {[...CANDIDATES.map((c) => ({ id: `demo-head-${c.label}`, color: c.color })), { id: "demo-head-av", color: IMAGE_COLOR }].map(
        (m) => (
          <marker key={m.id} id={m.id} markerWidth="5" markerHeight="5" refX="4.2" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill={m.color} />
          </marker>
        ),
      )}
    </defs>
  );
}

function Board({
  testing,
  ruledOut,
  solved,
}: {
  testing?: string;
  ruledOut: string[];
  solved?: boolean;
}) {
  const active = CANDIDATES.find((c) => c.label === testing);
  return (
    <>
      <div className="calc-matrix-display" aria-label="2 by 2 matrix">
        <span className="calc-matrix-bracket">[</span>
        <div className="calc-matrix-cells">
          <span>{MATRIX[0][0]}</span>
          <span>{MATRIX[0][1]}</span>
          <span>{MATRIX[1][0]}</span>
          <span>{MATRIX[1][1]}</span>
        </div>
        <span className="calc-matrix-bracket">]</span>
      </div>

      <svg viewBox={`0 0 ${BOX} ${BOX}`} className="calc-eigen-plot calc-demo-plot" aria-hidden="true">
        <ArrowHeads />
        <line x1={0} y1={ORIGIN} x2={BOX} y2={ORIGIN} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <line x1={ORIGIN} y1={0} x2={ORIGIN} y2={BOX} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        {CANDIDATES.map((c) => (
          <Arrow
            key={c.label}
            c={c}
            lit={c.label === testing || (solved === true && c.label === ANSWER)}
            dim={ruledOut.includes(c.label) || (testing !== undefined && c.label !== testing)}
          />
        ))}
        {active && <ImageArrow c={active} />}
      </svg>

      <div className="calc-choice-grid">
        {CANDIDATES.map((c) => {
          const isOut = ruledOut.includes(c.label);
          const isTesting = c.label === testing;
          const isAnswer = solved && c.label === ANSWER;
          const cls = [
            "calc-choice",
            isAnswer ? "is-answer" : "",
            isOut ? "is-demo-out" : "",
            isTesting ? "is-demo-testing" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button type="button" key={c.label} className={cls} disabled aria-disabled="true">
              <span style={{ color: c.color, fontWeight: 700, marginRight: 6 }}>{c.label}</span>({c.x}, {c.y})
            </button>
          );
        })}
      </div>
    </>
  );
}

export const EIGEN_DEMO: DemoStep[] = [
  {
    term: "This is the board",
    body:
      "A matrix at the top, the same four directions drawn as arrows and listed as buttons. Exactly one of them is an eigenvector of A - applying A leaves it on its own line, just longer, shorter, or flipped. The other three get rotated off their line. Your job is one click.",
    board: <Board ruledOut={[]} />,
    note: "Watch me work all four, then you'll get a fresh matrix to do yourself.",
  },
  {
    term: "Test A = (1, 1)",
    body:
      "Multiply A by the vector, then ask whether the result sits on the same line. I use the cross-product test - p·y − q·x - because it never divides, so a zero component can't break it. The dashed green arrow is where A sent it.",
    board: <Board testing="A" ruledOut={[]} />,
    math: [
      "A·(1,1)  =  (3·1 + 1·1,  0·1 + 2·1)",
      "         =  (4, 2)",
      "cross    =  4·1 − 2·1  =  2   ≠ 0",
    ],
    note: "Nonzero, and you can see it on the plot: the dashed arrow swung off A's line. Rotated - rule it out.",
  },
  {
    term: "Test B = (2, −1)",
    body:
      "Same two lines of work. Careful with the signs here - this is where people drop a minus and talk themselves into a wrong answer.",
    board: <Board testing="B" ruledOut={["A"]} />,
    math: [
      "A·(2,−1) =  (3·2 + 1·(−1),  0·2 + 2·(−1))",
      "         =  (5, −2)",
      "cross    =  5·(−1) − (−2)·2  =  −5 + 4  =  −1   ≠ 0",
    ],
    note: "Nonzero again. Two down.",
  },
  {
    term: "Test C = (1, 0)",
    body:
      "Now watch the plot rather than the algebra. The dashed arrow lands straight along C, just longer - it never left the line. The arithmetic confirms it.",
    board: <Board testing="C" ruledOut={["A", "B"]} />,
    math: [
      "A·(1,0)  =  (3·1 + 1·0,  0·1 + 2·0)",
      "         =  (3, 0)",
      "cross    =  3·0 − 0·1  =  0   ✓",
    ],
    note: "Zero. And (3, 0) is exactly 3·(1, 0) - same direction, stretched by 3. That's the eigenvector, with λ = 3.",
  },
  {
    term: "Click C - here's what the game shows you",
    body:
      "This is the reveal you get after clicking. It restates A·v and tells you whether it was a scalar multiple. Since I tested before clicking, there's no guesswork in it.",
    board: <Board ruledOut={["A", "B", "D"]} solved />,
    math: ["A · (1, 0)  =  (3, 0)", "→ scalar multiple of the input", "→ same line, so it IS an eigenvector"],
    note: "Correct. Score goes up, and the next matrix is generated fresh.",
  },
  {
    term: "How to do it fast",
    body:
      "You don't have to test all four. Read the plot first - any arrow whose dashed image obviously swings into a different quadrant is out on sight. Rank the four by eye, then run the cross-product test on your best candidate only. In a real round that's usually one computation, not four.",
    board: <Board ruledOut={[]} />,
    note: "The interview follow-up is always \"and the eigenvalue?\" - read it off the stretch factor, 3 here.",
  },
];
