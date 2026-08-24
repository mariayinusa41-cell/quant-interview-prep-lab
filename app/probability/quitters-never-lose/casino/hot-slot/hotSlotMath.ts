// Core math for XXX — a numbered wheel. Pick a number; each spin lands on
// one active number at random. Land on one of YOUR marked numbers and
// you're out. Land on anything else and that number is removed from the
// wheel for good — the pool shrinks, the multiplier compounds, and you spin
// again on the same pick. Answer a question wrong before a spin and you
// have to mark an ADDITIONAL number before you're allowed to spin — a wrong
// answer literally makes your odds worse, not just a scoreboard ding.
//
// This is the classic quant-interview no-replacement conditional-probability
// problem — same underlying math as the scratch-off batch/no-replacement
// question, just reskinned onto a spinning wheel. No color mechanic, no
// wager-for-survival framing tied to anything lethal — landing on your
// number just means you're out, a clean elimination.

export type Spot = { id: number; active: boolean };

export function buildSpots(count: number): Spot[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, active: true }));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function reduceFraction(numerator: number, denominator: number): { fraction: string; decimal: number } {
  if (denominator === 0) return { fraction: "0", decimal: 0 };
  const g = gcd(numerator, denominator) || 1;
  const n = numerator / g;
  const d = denominator / g;
  return { fraction: d === 1 ? `${n}` : `${n}/${d}`, decimal: n / d };
}

export function nCr(n: number, r: number): number {
  let result = 1;
  for (let i = 0; i < r; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

export type WheelOdds = {
  activeCount: number;
  markedCount: number; // how many numbers currently eliminate you
  hitProb: { fraction: string; decimal: number }; // P(land on one of your marked numbers)
  safeProb: { fraction: string; decimal: number };
  fairMultiplier: number; // 1 / safeProb — zero house edge
  offeredMultiplier: number; // what the game actually pays on a safe spin
  arrangements: number; // C(activeCount, markedCount) — ways the marked numbers could sit among the active ones
};

const HOUSE_EDGE = 0.03; // pays 97% of the fair multiplier on a safe spin

export function computeOdds(spots: Spot[], markedIds: number[]): WheelOdds {
  const active = spots.filter((s) => s.active);
  const markedCount = markedIds.filter((id) => active.some((s) => s.id === id)).length;

  const hitProb = reduceFraction(markedCount, active.length);
  const safeProb = reduceFraction(active.length - markedCount, active.length);
  const fairMultiplier = safeProb.decimal > 0 ? 1 / safeProb.decimal : 0;
  const offeredMultiplier = Math.round(fairMultiplier * (1 - HOUSE_EDGE) * 100) / 100;
  const arrangements = nCr(active.length, markedCount);

  return { activeCount: active.length, markedCount, hitProb, safeProb, fairMultiplier, offeredMultiplier, arrangements };
}

export function spin(spots: Spot[]): Spot {
  const active = spots.filter((s) => s.active);
  return active[Math.floor(Math.random() * active.length)];
}
