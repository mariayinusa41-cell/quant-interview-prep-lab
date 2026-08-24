import { rnd, type Item } from "./types";

// The point of a mental-math screen is that a trained candidate uses a
// shortcut, not that they grind long multiplication. So numbers are chosen to
// FIT a heuristic — difference of squares, percentage swaps, round-number
// anchoring. Purely random operands would measure something else entirely.

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
}

/** a x b where the pair straddles a round number: (r-d)(r+d) = r^2 - d^2. */
function diffOfSquares(id: string): Item {
  const r = rnd.pick([20, 30, 40, 50, 60, 70, 80, 90]);
  const d = rnd.int(1, Math.min(9, r / 10 + 4));
  return {
    id, kind: "numeric",
    prompt: `${r - d} × ${r + d}`,
    answer: (r - d) * (r + d),
    tolerance: 0,
    skill: "mental-math",
    explain: `(${r}−${d})(${r}+${d}) = ${r}² − ${d}² = ${r * r} − ${d * d} = ${r * r - d * d}.`,
  };
}

/** p% of q, chosen so the swap p% of q = q% of p is the fast route. */
function percentSwap(id: string): Item {
  const p = rnd.pick([4, 8, 12, 15, 16, 24, 25, 35, 38, 45, 62, 75]);
  const q = rnd.pick([50, 120, 150, 200, 240, 250, 300, 350, 400, 500]);
  const v = (p / 100) * q;
  const easy = (q / 100) * p;
  return {
    id, kind: "numeric",
    prompt: `${p}% of ${q}`,
    answer: v,
    tolerance: 0.001,
    skill: "mental-math",
    explain: `Swap it: ${p}% of ${q} = ${q}% of ${p} = ${fmt(easy)}.`,
  };
}

/** Division that resolves cleanly once scaled to whole numbers. */
function decimalDivide(id: string): Item {
  const divisor = rnd.pick([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 1.2, 1.5, 2.5]);
  const quotient = rnd.int(3, 40);
  const dividend = Math.round(divisor * quotient * 1000) / 1000;
  return {
    id, kind: "numeric",
    prompt: `${fmt(dividend)} ÷ ${fmt(divisor)}`,
    answer: quotient,
    tolerance: 0.01,
    skill: "mental-math",
    explain: `Scale both by ${1 / divisor >= 1 ? "the reciprocal" : "10"}: ${fmt(dividend)} ÷ ${fmt(divisor)} = ${quotient}.`,
  };
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Fraction of an integer, chosen so the denominator divides cleanly. */
function fractionOf(id: string): Item {
  const den = rnd.pick([3, 4, 5, 6, 7, 8, 9, 11, 12]);
  // Keep it in lowest terms — an unreduced 2/4 looks careless on a real form.
  let num = rnd.int(1, den - 1);
  let guard = 0;
  while (gcd(num, den) !== 1 && guard < 20) { num = rnd.int(1, den - 1); guard += 1; }
  const mult = rnd.int(2, 15);
  const target = den * mult;
  return {
    id, kind: "numeric",
    prompt: `${num}/${den} × ${target}`,
    answer: num * mult,
    tolerance: 0,
    skill: "mental-math",
    explain: `${target} ÷ ${den} = ${mult}, then × ${num} = ${num * mult}.`,
  };
}

/** Squares and roots of memorable numbers. */
function powerFact(id: string): Item {
  if (Math.random() < 0.5) {
    const base = rnd.pick([12, 13, 14, 15, 16, 18, 22, 25, 35, 45]);
    return {
      id, kind: "numeric",
      prompt: `${base}²`,
      answer: base * base,
      tolerance: 0,
      skill: "mental-math",
      explain: `${base}² = ${base * base}.`,
    };
  }
  const p = rnd.pick([4, 6, 8, 10, 12]);
  const v = Math.pow(2, p);
  return {
    id, kind: "numeric",
    prompt: `√${v * v}`,
    answer: v,
    tolerance: 0,
    skill: "mental-math",
    explain: `${v * v} = ${v}², and ${v} = 2^${p}.`,
  };
}

/** Two-step arithmetic under the same time budget. */
function chained(id: string): Item {
  const a = rnd.int(11, 49);
  const b = rnd.pick([4, 5, 6, 8, 9, 11, 12]);
  const c = rnd.int(10, 99);
  return {
    id, kind: "numeric",
    prompt: `${a} × ${b} − ${c}`,
    answer: a * b - c,
    tolerance: 0,
    skill: "mental-math",
    explain: `${a} × ${b} = ${a * b}; ${a * b} − ${c} = ${a * b - c}.`,
  };
}

const GENERATORS = [diffOfSquares, percentSwap, decimalDivide, fractionOf, powerFact, chained];

/**
 * Builds `n` items from a weighted mix. Weights let one sitting lean decimal
 * and another lean fractional without changing the engine.
 */
export function mentalMathSet(
  n: number,
  weights: Partial<Record<
    "diffOfSquares" | "percentSwap" | "decimalDivide" | "fractionOf" | "powerFact" | "chained",
    number
  >> = {},
): Item[] {
  const named: Record<string, (id: string) => Item> = {
    diffOfSquares, percentSwap, decimalDivide, fractionOf, powerFact, chained,
  };
  const pool: ((id: string) => Item)[] = [];
  const keys = Object.keys(named);
  keys.forEach((k) => {
    const w = weights[k as keyof typeof weights] ?? 1;
    for (let i = 0; i < w; i += 1) pool.push(named[k]);
  });
  const use = pool.length ? pool : GENERATORS;
  return Array.from({ length: n }, (_, i) => rnd.pick(use)(`mm-${i}`));
}
