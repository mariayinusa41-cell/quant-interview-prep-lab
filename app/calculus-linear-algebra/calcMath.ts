// All correctness in this file is computed, not authored — every classifier
// or "correct answer" below is derived from the actual numbers at runtime,
// so there is no hand-written answer key that can drift out of sync with a
// procedurally generated question (the failure mode static quiz banks have).

export type PSDLabel = "Positive definite" | "Positive semidefinite" | "Indefinite" | "Negative definite";

export type PSDMatrix = { a: number; b: number; c: number };

// Classify a symmetric 2x2 [[a,b],[b,c]] via trace/det (Sylvester's criterion
// generalized to the semidefinite boundary) rather than an authored label.
export function classifyPSD({ a, b, c }: PSDMatrix): PSDLabel {
  const det = a * c - b * b;
  const trace = a + c;
  if (det < 0) return "Indefinite";
  if (a > 0 && trace > 0) return det === 0 ? "Positive semidefinite" : "Positive definite";
  if (a < 0 && trace < 0) return "Negative definite";
  // det >= 0 and a === 0 (or a==0 boundary case) — only PSD if b is also 0
  return b === 0 && a >= 0 && c >= 0 ? "Positive semidefinite" : "Indefinite";
}

export function randomPSDMatrix(): PSDMatrix {
  const a = Math.floor(Math.random() * 9) - 4; // -4..4
  const c = Math.floor(Math.random() * 9) - 4;
  const b = Math.floor(Math.random() * 7) - 3; // -3..3
  return { a, b, c };
}

// ---------- Eigenvector spotter ----------
// Build A = P D P^-1 for a random diagonal D and random invertible integer P,
// so A is guaranteed real eigenvalues with exactly known eigenvectors: the
// columns of P (up to scale) are eigenvectors of A by construction.
export type Vec2 = { x: number; y: number };
export type EigenPuzzle = {
  matrix: [[number, number], [number, number]];
  eigenvector: Vec2; // one true eigenvector (columns of P)
  decoys: Vec2[]; // 3 non-eigenvector directions
};

function mat2x2Inverse(p: number[][]): number[][] {
  const [[p00, p01], [p10, p11]] = p;
  const det = p00 * p11 - p01 * p10;
  return [
    [p11 / det, -p01 / det],
    [-p10 / det, p00 / det],
  ];
}

function matMul(a: number[][], b: number[][]): number[][] {
  const out = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      out[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j];
    }
  }
  return out;
}

export function applyMatrix(m: [[number, number], [number, number]], v: Vec2): Vec2 {
  return { x: m[0][0] * v.x + m[0][1] * v.y, y: m[1][0] * v.x + m[1][1] * v.y };
}

// Cross-product test for parallelism (0 means same or opposite direction).
export function isEigenvector(m: [[number, number], [number, number]], v: Vec2, tolerance = 1e-6): boolean {
  const av = applyMatrix(m, v);
  const cross = av.x * v.y - av.y * v.x;
  return Math.abs(cross) < tolerance;
}

function randNonZeroInt(range: number): number {
  let n = 0;
  while (n === 0) n = Math.floor(Math.random() * (2 * range + 1)) - range;
  return n;
}

export function buildEigenPuzzle(): EigenPuzzle {
  // Random invertible integer P (columns are the true eigenvectors of A).
  let p00 = randNonZeroInt(3);
  let p10 = randNonZeroInt(3);
  let p01 = randNonZeroInt(3);
  let p11 = randNonZeroInt(3);
  // Ensure P is invertible and its two columns aren't parallel.
  while (p00 * p11 - p01 * p10 === 0) {
    p01 = randNonZeroInt(3);
    p11 = randNonZeroInt(3);
  }
  const P = [[p00, p01], [p10, p11]];
  const d1 = randNonZeroInt(3);
  let d2 = randNonZeroInt(3);
  // d1 === d2 makes D (and therefore A = P D P^-1) a scalar multiple of the
  // identity — every nonzero vector becomes an eigenvector, so there is no
  // single "correct" direction left to click. Force distinct eigenvalues.
  while (d2 === d1) d2 = randNonZeroInt(3);
  const D = [[d1, 0], [0, d2]];
  const Pinv = mat2x2Inverse(P);
  // Deliberately NOT rounded: A's entries are rational but can need more
  // than 3 decimal digits to represent exactly, and isEigenvector's 1e-6
  // tolerance is tight enough that a 3-decimal display-rounding previously
  // broke the *true* eigenvector check outright (~23% of puzzles failed
  // their own answer key). Keep full float precision for every computation;
  // round only at render time for display.
  const matrix: [[number, number], [number, number]] = matMul(matMul(P, D), Pinv) as [
    [number, number],
    [number, number],
  ];

  const eigenvector: Vec2 = { x: p00, y: p10 };
  const otherEigenvector: Vec2 = { x: p01, y: p11 };

  // Decoys: the *other* true eigenvector is deliberately excluded from decoy
  // generation so there's only one correct click target; decoys are random
  // directions checked to not accidentally be eigenvectors either.
  const decoys: Vec2[] = [];
  let guard = 0;
  while (decoys.length < 3 && guard < 200) {
    guard++;
    const candidate = { x: randNonZeroInt(4), y: randNonZeroInt(4) };
    const parallelToTruth = Math.abs(candidate.x * eigenvector.y - candidate.y * eigenvector.x) < 1e-6;
    const parallelToOther = Math.abs(candidate.x * otherEigenvector.y - candidate.y * otherEigenvector.x) < 1e-6;
    const isEigen = isEigenvector(matrix, candidate);
    const dup = decoys.some((d) => d.x === candidate.x && d.y === candidate.y);
    if (!parallelToTruth && !parallelToOther && !isEigen && !dup) decoys.push(candidate);
  }
  // Defensive: if 200 tries still couldn't find 3 valid decoys (shouldn't
  // happen with distinct eigenvalues, but a puzzle with <4 total options is
  // worse than a retry), just build a fresh puzzle instead of shipping it.
  if (decoys.length < 3) return buildEigenPuzzle();
  return { matrix, eigenvector, decoys };
}

// ---------- Taylor order slider ----------
export type TaylorFn = { name: string; label: string; f: (x: number) => number; term: (k: number, x: number) => number };

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export const TAYLOR_FUNCTIONS: TaylorFn[] = [
  { name: "e^x", label: "eˣ", f: Math.exp, term: (k, x) => x ** k / factorial(k) },
  {
    name: "sin(x)",
    label: "sin(x)",
    f: Math.sin,
    term: (k, x) => {
      if (k % 2 === 0) return 0;
      const sign = (k - 1) / 2 % 2 === 0 ? 1 : -1;
      return (sign * x ** k) / factorial(k);
    },
  },
  {
    name: "cos(x)",
    label: "cos(x)",
    f: Math.cos,
    term: (k, x) => {
      if (k % 2 === 1) return 0;
      const sign = (k / 2) % 2 === 0 ? 1 : -1;
      return (sign * x ** k) / factorial(k);
    },
  },
  {
    name: "ln(1+x)",
    label: "ln(1 + x)",
    f: (x) => Math.log(1 + x),
    term: (k, x) => {
      if (k === 0) return 0;
      const sign = k % 2 === 1 ? 1 : -1;
      return (sign * x ** k) / k;
    },
  },
];

export function taylorApprox(fn: TaylorFn, x: number, order: number): number {
  let sum = 0;
  for (let k = 0; k <= order; k++) sum += fn.term(k, x);
  return sum;
}

export function taylorError(fn: TaylorFn, x: number, order: number): number {
  return Math.abs(fn.f(x) - taylorApprox(fn, x, order));
}

// The exact value of one specific term — this is what the player has to
// compute and add on each round of the redesigned Taylor game, term by
// term, rather than watching a live approximation converge on a slider.
export function taylorTerm(fn: TaylorFn, x: number, order: number): number {
  return fn.term(order, x);
}

// Smallest order (0..maxOrder) whose approximation error is at or below the
// target threshold; returns null if even the max order can't reach it.
export function minOrderForError(fn: TaylorFn, x: number, threshold: number, maxOrder = 10): number | null {
  for (let k = 0; k <= maxOrder; k++) {
    if (taylorError(fn, x, k) <= threshold) return k;
  }
  return null;
}

// ---------- Lagrange multipliers ----------
// Maximize f(x,y) = xy subject to the constraint ax + by = k (a, b, k > 0).
// The old version hardcoded a = b = 1 and let you just drag toward the peak
// of a live-updating xy readout — no Lagrange condition required at all.
// This version is solved with the actual method: ∇f = λ∇g gives
// (y, x) = λ(a, b), so y = λa and x = λb; substituting into the constraint,
// a(λb) + b(λa) = k ⇒ λ = k / (2ab), giving the closed form below. The
// player has to produce x* (or y*) from that reasoning — there's nothing to
// visually converge on before locking in an answer.
export type LagrangeProblem = { a: number; b: number; k: number };

export function randomLagrangeProblem(): LagrangeProblem {
  const a = Math.floor(Math.random() * 4) + 1; // 1..4
  const b = Math.floor(Math.random() * 4) + 1; // 1..4
  const k = Math.floor(Math.random() * 16) + 6; // 6..21
  return { a, b, k };
}

export function lagrangeObjective(x: number, y: number): number {
  return x * y;
}

export function lagrangeSolution({ a, b, k }: LagrangeProblem): { xStar: number; yStar: number; lambda: number; value: number } {
  const lambda = k / (2 * a * b);
  const xStar = lambda * b;
  const yStar = lambda * a;
  return { xStar, yStar, lambda, value: lagrangeObjective(xStar, yStar) };
}

// ---------- Newton's method stepper ----------
export type NewtonProblem = { a: number; label: string; root: number };

// f(x) = x^2 - a, root = sqrt(a). Kept to a clean closed-form root so the
// "how close are you" scoring has an exact target to compare against.
export function randomNewtonProblem(): NewtonProblem {
  const a = Math.floor(Math.random() * 18) + 3; // 3..20
  return { a, label: `x² − ${a} = 0`, root: Math.sqrt(a) };
}

export function newtonStep(a: number, xn: number): number {
  // f(x) = x^2 - a, f'(x) = 2x
  if (xn === 0) return 0.5; // dodge division by zero on a pathological start
  return xn - (xn * xn - a) / (2 * xn);
}
