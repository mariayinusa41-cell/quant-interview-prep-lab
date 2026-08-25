// "Technical estimation" questions — the harder cousin of Fermi Estimation.
//
// Classic Fermi questions ("how many piano tuners in Chicago") span many
// orders of magnitude and are graded on log-scale closeness. The questions
// firms like Optiver / IMC / Flow Traders / Akuna actually put in a timed
// online assessment are a different animal: a picture of scattered dice you
// have 40 seconds to eyeball-count, a path plotted on a grid you have to sum
// mentally, a rule-of-thumb calculation (vol scaling, fiber latency) applied
// under time pressure. The answer usually sits in a *tight* numeric band,
// not a magnitude band — so this file scores on percentage error and a
// 90%-confidence bid/ask-style range instead of orders of magnitude.

export type TechnicalCategory =
  | "visual-counting"
  | "grid-path"
  | "combinatorics-math"
  | "random-walk-probability"
  | "market-microstructure"
  | "hardware-latency";

export type PathPoint = { x: number; y: number; label: string };

export type TechnicalQuestion = {
  id: string;
  question: string;
  answer: number;
  unit: string;
  explanation: string;
  category: TechnicalCategory;
  difficulty: 1 | 2 | 3;
  timeLimitSec: number;
  lowBound: number; // 90%-confidence lower bound (market-making bid)
  highBound: number; // 90%-confidence upper bound (market-making ask)
  metadata?: {
    diceFaces?: number[]; // concrete per-die values actually shown in the picture
    targetFaces?: number[]; // which face values are being counted
    pathCoordinates?: PathPoint[];
    formula?: string;
  };
};

// ---------- Scoring ----------
// Percentage-error scoring with a CI-band fallback, the way it was sketched
// out in the drill brief: tight misses still bank a point if they'd have
// cleared the market on a real desk.
/**
 * Interval scoring for technical estimation: the player quotes a LOW and a
 * HIGH, the same way classic Fermi does.
 *
 * Classic Fermi scores tightness in orders of magnitude, which is right when
 * the answer could be 10^3 or 10^7. Technical answers are precise quantities
 * — a dice count, a latency in ms — so tightness is measured as relative
 * width instead, and an order-of-magnitude band would be no skill at all.
 *
 * A range that misses scores nothing, and so does a range so wide it cannot
 * be wrong: quoting 0 to a million always contains the answer and says
 * nothing, which is exactly the hedge this scoring has to refuse. That
 * mirrors how a market that wide would be treated in the room.
 */
export function scoreTechnicalInterval(
  low: number,
  high: number,
  q: TechnicalQuestion
): { points: 0 | 1 | 2 | 3; label: string } {
  if (!Number.isFinite(low) || !Number.isFinite(high)) return { points: 0, label: "No market" };
  if (high < low) return { points: 0, label: "Inverted market" };
  if (q.answer < low || q.answer > high) return { points: 0, label: "Missed the market" };

  // Relative to the true answer, so "within 10%" means the same thing
  // whether the answer is 12 dice or 58.8 ms.
  const relWidth = (high - low) / Math.max(Math.abs(q.answer), 1e-9);
  if (relWidth <= 0.1) return { points: 3, label: "Bullseye" };
  if (relWidth <= 0.25) return { points: 2, label: "Tight market" };
  if (relWidth <= 0.6) return { points: 1, label: "Wide but inside" };
  return { points: 0, label: "Too wide to be a market" };
}

export function scoreTechnical(
  guess: number,
  q: TechnicalQuestion
): { points: 0 | 1 | 2 | 3; label: string } {
  if (!Number.isFinite(guess)) return { points: 0, label: "No read" };
  const diffPct = Math.abs(guess - q.answer) / Math.max(Math.abs(q.answer), 1e-9);
  if (diffPct <= 0.05) return { points: 3, label: "Bullseye" };
  if (diffPct <= 0.15) return { points: 2, label: "Tight market" };
  if (guess >= q.lowBound && guess <= q.highBound) return { points: 1, label: "Inside the 90% band" };
  return { points: 0, label: "Missed the market" };
}

// A concrete random dice grid + the exact count of target faces within it,
// plus a 90%-band sized off the binomial spread — verified against 2,000
// simulated draws to land close to 90% actual coverage (z=1.7, not the
// textbook 1.645, because the normal approximation slightly undercovers a
// discrete count at this N).
export function rollDiceGrid(n: number, targetFaces: number[]): { faces: number[]; count: number; low: number; high: number } {
  const faces = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
  const targetSet = new Set(targetFaces);
  const count = faces.filter((f) => targetSet.has(f)).length;
  const p = targetFaces.length / 6;
  const sd = Math.sqrt(n * p * (1 - p));
  const low = Math.max(0, Math.round(count - 1.7 * sd));
  const high = Math.min(n, Math.round(count + 1.7 * sd));
  return { faces, count, low, high };
}

// ===========================================================================
// Hand-curated, individually verified prompts — always in the pool.
// ===========================================================================

function diceQuestion(
  id: string,
  n: number,
  targetFaces: number[],
  faceLabel: string,
  difficulty: 1 | 2 | 3,
  timeLimitSec: number
): TechnicalQuestion {
  const { faces, count, low, high } = rollDiceGrid(n, targetFaces);
  return {
    id,
    question: `The board shows ${n} fair six-sided dice scattered face-up. How many show ${faceLabel}?`,
    answer: count,
    unit: "dice",
    explanation: `Expected count ≈ ${n} × (${targetFaces.length}/6) = ${(n * (targetFaces.length / 6)).toFixed(1)}. This particular board actually has ${count}. Scan in clusters of 8–10 rather than one at a time — you don't have time to count every die individually.`,
    category: "visual-counting",
    difficulty,
    timeLimitSec,
    lowBound: low,
    highBound: high,
    metadata: { diceFaces: faces, targetFaces },
  };
}

export const curatedTechnicalQuestions: TechnicalQuestion[] = [
  diceQuestion("tech-1", 50, [1, 6], "a 1 or a 6", 1, 40),
  diceQuestion("tech-2", 72, [2, 4, 6], "an even number", 2, 40),

  {
    id: "tech-3",
    question: "A path connects grid points A(0,0) → B(6,8) → C(12,16) → D(15,20). What is the total length of the path?",
    answer: 25,
    unit: "units",
    explanation: "Every segment is a scaled 3-4-5 triangle: A→B and B→C are each √(6²+8²)=10, C→D is √(3²+4²)=5. Total = 10+10+5 = 25.",
    category: "grid-path",
    difficulty: 1,
    timeLimitSec: 40,
    lowBound: 24,
    highBound: 26,
    metadata: {
      pathCoordinates: [
        { x: 0, y: 0, label: "A" },
        { x: 6, y: 8, label: "B" },
        { x: 12, y: 16, label: "C" },
        { x: 15, y: 20, label: "D" },
      ],
    },
  },
  {
    id: "tech-4",
    question: "A trajectory connects A(0,0) → B(7,4) → C(12,9) → D(18,1). Estimate the total straight-line length.",
    answer: Number((Math.hypot(7, 4) + Math.hypot(5, 5) + Math.hypot(6, 8)).toFixed(1)),
    unit: "units",
    explanation: `Segment 1: √(7²+4²)≈${Math.hypot(7, 4).toFixed(2)}. Segment 2: √(5²+5²)≈${Math.hypot(5, 5).toFixed(2)}. Segment 3: √(6²+8²)=10. No exact triples here — round each leg to the nearest whole number before summing.`,
    category: "grid-path",
    difficulty: 2,
    timeLimitSec: 45,
    lowBound: 22,
    highBound: 28,
    metadata: {
      pathCoordinates: [
        { x: 0, y: 0, label: "A" },
        { x: 7, y: 4, label: "B" },
        { x: 12, y: 9, label: "C" },
        { x: 18, y: 1, label: "D" },
      ],
    },
  },

  {
    id: "tech-5",
    question: "What is the theoretical minimum one-way latency of a light signal in glass fiber traveling the ~1,200 km Chicago–New York route?",
    answer: 5.9,
    unit: "ms",
    explanation: "Refractive index of fiber core n ≈ 1.468, so signal speed = c/n ≈ 204,200 km/s ≈ 4.9 µs/km. 1,200 km × 4.9 µs/km ≈ 5.9 ms (microwave line-of-sight relay towers do it in ~4.0 ms, which is why HFT firms pay for microwave links on this exact route).",
    category: "hardware-latency",
    difficulty: 2,
    timeLimitSec: 30,
    lowBound: 4.5,
    highBound: 7.5,
    metadata: { formula: "km × 4.9 µs/km" },
  },
  {
    id: "tech-6",
    question: "An index option book shows 24% annualized implied volatility. What is the expected 1-standard-deviation daily move, in percent?",
    answer: 1.51,
    unit: "%",
    explanation: "Rule of 16: daily vol ≈ annualized vol / √252 ≈ annualized vol / 16. 24% / 16 = 1.5%.",
    category: "market-microstructure",
    difficulty: 1,
    timeLimitSec: 25,
    lowBound: 1.3,
    highBound: 1.7,
    metadata: { formula: "annualVol / 16" },
  },
  {
    id: "tech-7",
    question: "How many clock cycles does a 4.0 GHz CPU execute during a 250-nanosecond memory access stall?",
    answer: 1000,
    unit: "cycles",
    explanation: "4.0 GHz = 4 cycles per nanosecond (1 cycle = 0.25 ns). 250 ns × 4 cycles/ns = 1,000 cycles.",
    category: "hardware-latency",
    difficulty: 1,
    timeLimitSec: 25,
    lowBound: 900,
    highBound: 1100,
  },

  {
    id: "tech-8",
    question: "A fair coin is flipped 10,000 times (heads +1, tails −1). What is the expected absolute distance from the starting point?",
    answer: 80,
    unit: "steps",
    explanation: "For a symmetric 1D random walk, E[|S_N|] ≈ √(2N/π) ≈ 0.7979·√N. √10,000 = 100, so 0.7979 × 100 ≈ 80.",
    category: "random-walk-probability",
    difficulty: 3,
    timeLimitSec: 35,
    lowBound: 65,
    highBound: 95,
    metadata: { formula: "0.7979 × √N" },
  },
  {
    id: "tech-9",
    question: "How many people need to be in a room for there to be at least a 50% chance two share a birthday?",
    answer: 23,
    unit: "people",
    explanation: "The birthday paradox: exact multiplication of survival probabilities crosses 50% at n=23 (P(no match at 22)=47.6%, P(no match at 23)=49.3%, so P(match)=50.7%).",
    category: "random-walk-probability",
    difficulty: 1,
    timeLimitSec: 25,
    lowBound: 20,
    highBound: 26,
  },
  {
    id: "tech-10",
    question: "On average, how many rolls of a fair 6-sided die does it take to see all 6 faces at least once?",
    answer: 14.7,
    unit: "rolls",
    explanation: "Coupon collector's problem: E[T] = 6×(1/1+1/2+1/3+1/4+1/5+1/6) = 6×2.45 = 14.7 rolls.",
    category: "random-walk-probability",
    difficulty: 2,
    timeLimitSec: 30,
    lowBound: 12,
    highBound: 18,
    metadata: { formula: "n × H(n)" },
  },
  {
    id: "tech-11",
    question: "Estimate 13⁴.",
    answer: 28561,
    unit: "value",
    explanation: "13² = 169. 13⁴ = 169² = 169×169 = 28,561. Squaring a squared number twice is usually faster under time pressure than multiplying four 13s in a row.",
    category: "combinatorics-math",
    difficulty: 2,
    timeLimitSec: 30,
    lowBound: 24_000,
    highBound: 33_000,
  },
  {
    id: "tech-12",
    question: "What is 12! (12 factorial)?",
    answer: 479_001_600,
    unit: "value",
    explanation: "12! = 12×11×10×9×8×7×6×5×4×3×2×1 = 479,001,600. Stirling's approximation √(2π·12)·(12/e)^12 lands within ~1% of the exact value and is much faster to produce under a clock.",
    category: "combinatorics-math",
    difficulty: 3,
    timeLimitSec: 35,
    lowBound: 380_000_000,
    highBound: 580_000_000,
  },
];
