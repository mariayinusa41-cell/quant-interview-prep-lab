// Procedural generators for the "technical estimation" pool. Same idea as
// proceduralFermi.ts — a small number of templates crossed against a matrix
// of parameters — but every generator here produces a question with a
// *tight*, verifiable numeric answer instead of an order-of-magnitude
// guess, and the dice/path questions re-roll their concrete picture on every
// call so a replay never shows the same board twice.

import { rollDiceGrid, type TechnicalQuestion } from "./technicalQuestions";

let counter = 0;
const nextId = (tag: string) => `gen-${tag}-${counter++}`;

// ---------------------------------------------------------------------------
// A. Visual dice counting
// ---------------------------------------------------------------------------
const DICE_COUNTS = [40, 45, 50, 54, 60, 66, 72, 80, 90, 100];
const DICE_TARGETS: { label: string; faces: number[] }[] = [
  { label: "a 6", faces: [6] },
  { label: "a 1", faces: [1] },
  { label: "a 1 or a 6", faces: [1, 6] },
  { label: "an even number", faces: [2, 4, 6] },
  { label: "a prime number (2, 3, or 5)", faces: [2, 3, 5] },
  { label: "5 or higher", faces: [5, 6] },
  { label: "3 or lower", faces: [1, 2, 3] },
];

function genDiceQuestions(): TechnicalQuestion[] {
  const out: TechnicalQuestion[] = [];
  for (const n of DICE_COUNTS) {
    for (const target of DICE_TARGETS) {
      const { faces, count, low, high } = rollDiceGrid(n, target.faces);
      const p = target.faces.length / 6;
      out.push({
        id: nextId("dice"),
        question: `The board shows ${n} fair six-sided dice scattered face-up. How many show ${target.label}?`,
        answer: count,
        unit: "dice",
        explanation: `Expected count ≈ ${n} × (${target.faces.length}/6) ≈ ${(n * p).toFixed(1)}; this board actually has ${count}. Scan in small clusters — don't try to track a running tally die by die.`,
        category: "visual-counting",
        difficulty: n >= 72 ? 2 : 1,
        timeLimitSec: 40,
        lowBound: low,
        highBound: high,
        metadata: { diceFaces: faces, targetFaces: target.faces },
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// B. Grid-path Euclidean distance. Pythagorean triples (scaled) keep most
// legs mentally computable; a handful of "ugly" legs are mixed in so the
// drill doesn't become pattern-matching against known triples.
// ---------------------------------------------------------------------------
// Legs are grouped into a "small" and "big" tier so every leg picked for a
// given path stays within the same tier — mixing e.g. a (4,6) leg with a
// (9,40) leg in one path produced a lopsided, hard-to-read picture where one
// point sits far off in a corner and the rest cluster together.
const SMALL_LEGS: [number, number][] = [
  [3, 4], [5, 12], [4, 6], [7, 3], [5, 9], [6, 11], [8, 5],
];
const BIG_LEGS: [number, number][] = [
  [8, 15], [7, 24], [20, 21], [9, 40], [12, 16], [15, 20],
];
const SCALES = [1, 1.5, 2, 2.5, 3];
const LABELS = ["A", "B", "C", "D", "E", "F"];

function randSign() {
  return Math.random() > 0.5 ? 1 : -1;
}

function genPathQuestions(): TechnicalQuestion[] {
  const out: TechnicalQuestion[] = [];
  for (const scale of SCALES) {
    for (let variant = 0; variant < 8; variant++) {
      const legCount = 2 + Math.floor(Math.random() * 3); // 2..4 segments -> 3..5 points
      const tier = Math.random() > 0.5 ? BIG_LEGS : SMALL_LEGS;
      const legs: [number, number][] = [];
      for (let i = 0; i < legCount; i++) {
        const [a, b] = tier[Math.floor(Math.random() * tier.length)];
        legs.push([Math.round(a * scale) * randSign(), Math.round(b * scale) * randSign()]);
      }

      let x = 0;
      let y = 0;
      let total = 0;
      const coords: { x: number; y: number; label: string }[] = [{ x: 0, y: 0, label: "A" }];
      const legDetails: string[] = [];
      legs.forEach(([dx, dy], i) => {
        const len = Math.hypot(dx, dy);
        total += len;
        x += dx;
        y += dy;
        coords.push({ x, y, label: LABELS[i + 1] });
        legDetails.push(`√(${Math.abs(dx)}²+${Math.abs(dy)}²)≈${len.toFixed(1)}`);
      });

      const answer = Number(total.toFixed(1));
      const waypointStr = coords.map((c) => `${c.label}(${c.x},${c.y})`).join(" → ");

      out.push({
        id: nextId("path"),
        question: `A path on the grid runs ${waypointStr}. What is the total straight-line length of the path?`,
        answer,
        unit: "units",
        explanation: `Sum each leg: ${legDetails.join(" + ")} = ${answer}.`,
        category: "grid-path",
        difficulty: legCount >= 4 ? 2 : 1,
        timeLimitSec: 40,
        lowBound: Number((answer * 0.92).toFixed(1)),
        highBound: Number((answer * 1.08).toFixed(1)),
        metadata: { pathCoordinates: coords },
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// C. Powers & factorials
// ---------------------------------------------------------------------------
// Was 14 bases x {3,4,5} = 42 questions, 17% of the whole technical pool,
// and the least representative thing in it: "estimate 21^5" is raw
// arithmetic grinding, not the estimation skill this mode is meant to
// drill. Cut to cubes of a few small bases, which are worth having at
// hand (7^3, 12^3) and take one step rather than four.
const POWER_BASES = [7, 8, 9, 12];
const EXPONENTS: (3 | 4 | 5)[] = [3];

function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function genPowerFactorialQuestions(): TechnicalQuestion[] {
  const out: TechnicalQuestion[] = [];
  for (const base of POWER_BASES) {
    for (const exp of EXPONENTS) {
      const val = Math.pow(base, exp);
      const shortcut =
        exp === 3
          ? `${base} × ${base}² = ${base} × ${base * base}`
          : exp === 4
            ? `(${base}²)² = ${base * base}²`
            : `${base}² × ${base}³`;
      out.push({
        id: nextId("pow"),
        question: `Estimate ${base}^${exp}.`,
        answer: val,
        unit: "value",
        explanation: `${shortcut} = ${val.toLocaleString()}.`,
        category: "combinatorics-math",
        difficulty: exp >= 4 ? 2 : 1,
        timeLimitSec: 30,
        lowBound: Number((val * 0.85).toPrecision(3)),
        highBound: Number((val * 1.15).toPrecision(3)),
      });
    }
  }

  // 13!-15! are pure multiplication under a clock; the small ones are
  // genuinely worth recognising on sight.
  for (const n of [7, 8, 9, 10]) {
    const val = fact(n);
    out.push({
      id: nextId("fact"),
      question: `What is ${n}! (${n} factorial)?`,
      answer: val,
      unit: "value",
      explanation: `Exact: ${val.toLocaleString()}. Stirling's approximation √(2π·${n})·(${n}/e)^${n} gets within ~1% and is faster to produce under a clock than multiplying it out.`,
      category: "combinatorics-math",
      difficulty: n >= 12 ? 3 : 2,
      timeLimitSec: 35,
      lowBound: Number((val * 0.8).toPrecision(3)),
      highBound: Number((val * 1.2).toPrecision(3)),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// D. Random walks, birthday paradox, coupon collector
// ---------------------------------------------------------------------------
const WALK_STEPS = [100, 400, 900, 1600, 2500, 3600, 4900, 6400, 10000, 40000];

function genWalkQuestions(): TechnicalQuestion[] {
  const out: TechnicalQuestion[] = [];
  for (const steps of WALK_STEPS) {
    const exact = 0.797885 * Math.sqrt(steps);
    const answer = Number(exact.toFixed(1));
    out.push({
      id: nextId("walk"),
      question: `A fair coin is flipped ${steps.toLocaleString()} times (heads +1, tails −1). What is the expected absolute distance from the start?`,
      answer,
      unit: "steps",
      explanation: `E[|S_N|] ≈ √(2N/π) ≈ 0.7979 × √N = 0.7979 × ${Math.sqrt(steps).toFixed(1)} ≈ ${answer}.`,
      category: "random-walk-probability",
      difficulty: steps > 5000 ? 2 : 1,
      timeLimitSec: 30,
      lowBound: Number((answer * 0.85).toFixed(1)),
      highBound: Number((answer * 1.15).toFixed(1)),
      metadata: { formula: "0.7979 × √N" },
    });
  }

  function firstNForProb(threshold: number, days: number): number {
    let p = 1;
    for (let n = 1; n <= days; n++) {
      p *= (days - (n - 1)) / days;
      if (1 - p >= threshold) return n;
    }
    return days;
  }
  const BIRTHDAY_VARIANTS = [
    { threshold: 0.5, days: 365, label: "at least a 50% chance two share a birthday" },
    { threshold: 0.7, days: 365, label: "at least a 70% chance two share a birthday" },
    { threshold: 0.9, days: 365, label: "at least a 90% chance two share a birthday" },
    { threshold: 0.5, days: 52, label: "at least a 50% chance two share a birth-week (52 weeks/year)" },
  ];
  for (const v of BIRTHDAY_VARIANTS) {
    const n = firstNForProb(v.threshold, v.days);
    out.push({
      id: nextId("birthday"),
      question: `How many people need to be in a room for there to be ${v.label}?`,
      answer: n,
      unit: "people",
      explanation: `Multiplying survival probabilities (1 - 1/${v.days})×(1 - 2/${v.days})×... crosses ${(v.threshold * 100).toFixed(0)}% at n=${n}.`,
      category: "random-walk-probability",
      difficulty: 2,
      timeLimitSec: 30,
      lowBound: Math.max(2, Math.round(n * 0.8)),
      highBound: Math.round(n * 1.25),
    });
  }

  function couponCollector(n: number): number {
    let s = 0;
    for (let i = 1; i <= n; i++) s += n / i;
    return s;
  }
  const COUPON_SCENARIOS = [
    { n: 4, thing: "a fair 4-sided die", unit: "rolls" },
    { n: 6, thing: "a fair 6-sided die", unit: "rolls" },
    { n: 8, thing: "a fair 8-sided die", unit: "rolls" },
    { n: 10, thing: "one of 10 equally likely cereal-box prizes", unit: "boxes" },
    { n: 12, thing: "one of 12 equally likely trading-card inserts", unit: "packs" },
    { n: 20, thing: "a fair 20-sided die", unit: "rolls" },
  ];
  for (const s of COUPON_SCENARIOS) {
    const exact = Number(couponCollector(s.n).toFixed(1));
    out.push({
      id: nextId("coupon"),
      question: `On average, how many ${s.unit} does it take to collect all ${s.n} outcomes of ${s.thing}, each equally likely?`,
      answer: exact,
      unit: s.unit,
      explanation: `Coupon collector's problem: E[T] = n × (1/1 + 1/2 + ... + 1/n) = ${s.n} × H(${s.n}) ≈ ${exact}.`,
      category: "random-walk-probability",
      difficulty: s.n >= 12 ? 2 : 1,
      timeLimitSec: 30,
      lowBound: Number((exact * 0.82).toFixed(1)),
      highBound: Number((exact * 1.2).toFixed(1)),
      metadata: { formula: "n × H(n)" },
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// E. Market microstructure & hardware latency rules of thumb
// ---------------------------------------------------------------------------
const VOLS = [12, 16, 20, 24, 28, 32, 40, 48, 64, 80];

function genMarketQuestions(): TechnicalQuestion[] {
  const out: TechnicalQuestion[] = [];
  for (const v of VOLS) {
    const daily = Number((v / Math.sqrt(252)).toFixed(2));
    out.push({
      id: nextId("vol"),
      question: `An asset has ${v}% annualized implied volatility. Estimate its expected 1-day standard deviation, in percent.`,
      answer: daily,
      unit: "%",
      explanation: `Rule of 16: daily vol ≈ annual vol / √252 ≈ annual vol / 16 = ${(v / 16).toFixed(2)}% (exact: ${daily}%).`,
      category: "market-microstructure",
      difficulty: 1,
      timeLimitSec: 25,
      lowBound: Number((daily * 0.88).toFixed(2)),
      highBound: Number((daily * 1.12).toFixed(2)),
      metadata: { formula: "annualVol / 16" },
    });

    const weekly = Number((v / Math.sqrt(52)).toFixed(2));
    out.push({
      id: nextId("vol-wk"),
      question: `Same ${v}% annualized volatility — estimate the expected 1-week standard deviation, in percent.`,
      answer: weekly,
      unit: "%",
      explanation: `weekly vol ≈ annual vol / √52 ≈ annual vol / 7.21 = ${(v / 7.21).toFixed(2)}% (exact: ${weekly}%).`,
      category: "market-microstructure",
      difficulty: 2,
      timeLimitSec: 25,
      lowBound: Number((weekly * 0.88).toFixed(2)),
      highBound: Number((weekly * 1.12).toFixed(2)),
      metadata: { formula: "annualVol / √52" },
    });
  }

  const CONTRACTS: { name: string; count: number; multiplier: number; price: number }[] = [
    { name: "S&P 500 E-mini (ES)", count: 1_600_000, multiplier: 50, price: 5500 },
    { name: "Nasdaq-100 E-mini (NQ)", count: 400_000, multiplier: 20, price: 19000 },
    { name: "10-Year Treasury futures (ZN)", count: 1_200_000, multiplier: 1000, price: 110 },
    { name: "Crude Oil futures (CL)", count: 900_000, multiplier: 1000, price: 75 },
    { name: "Gold futures (GC)", count: 200_000, multiplier: 100, price: 2400 },
  ];
  for (const c of CONTRACTS) {
    const notional = c.count * c.multiplier * c.price;
    out.push({
      id: nextId("notional"),
      question: `On an average day, ~${c.count.toLocaleString()} ${c.name} contracts trade (multiplier $${c.multiplier}, price ≈ ${c.price.toLocaleString()}). Estimate the total daily notional volume in USD.`,
      answer: notional,
      unit: "USD",
      explanation: `Notional per contract = $${c.multiplier} × ${c.price.toLocaleString()} = $${(c.multiplier * c.price).toLocaleString()}. × ${c.count.toLocaleString()} contracts ≈ $${notional.toLocaleString()}.`,
      category: "market-microstructure",
      difficulty: 2,
      timeLimitSec: 40,
      lowBound: Math.round(notional * 0.8),
      highBound: Math.round(notional * 1.2),
    });
  }

  return out;
}

// Ten routes x two media was the same two multiplications twenty times.
// Kept the spread that actually matters (a metro hop, a domestic leg, a
// transatlantic and a transpacific route) so the fibre-vs-microwave
// comparison still lands without dominating the pool.
const FIBER_KM = [300, 1000, 6000, 12000];

function genLatencyQuestions(): TechnicalQuestion[] {
  const out: TechnicalQuestion[] = [];
  for (const km of FIBER_KM) {
    const fiberMs = Number(((km * 4.9) / 1000).toFixed(2));
    out.push({
      id: nextId("fiber"),
      question: `What is the theoretical minimum one-way glass-fiber latency for a ${km.toLocaleString()} km route?`,
      answer: fiberMs,
      unit: "ms",
      explanation: `Signal speed in standard fiber (n≈1.468) ≈ 204,200 km/s ≈ 4.9 µs/km. ${km.toLocaleString()} km × 4.9 µs/km ≈ ${fiberMs} ms.`,
      category: "hardware-latency",
      difficulty: km > 2000 ? 2 : 1,
      timeLimitSec: 30,
      lowBound: Number((fiberMs * 0.85).toFixed(2)),
      highBound: Number((fiberMs * 1.15).toFixed(2)),
      metadata: { formula: "km × 4.9 µs/km" },
    });

    const microwaveMs = Number(((km * 3.336) / 1000).toFixed(2)); // ~c, line-of-sight relay chain
    out.push({
      id: nextId("mw"),
      question: `Same ${km.toLocaleString()} km route relayed over line-of-sight microwave towers instead of fiber. Estimate the one-way latency.`,
      answer: microwaveMs,
      unit: "ms",
      explanation: `Microwave travels through air at ≈ c (299,792 km/s ≈ 3.336 µs/km), versus ~4.9 µs/km in fiber — about 32% faster, which is the entire reason HFT firms pay for microwave links on short high-value routes.`,
      category: "hardware-latency",
      difficulty: 2,
      timeLimitSec: 30,
      lowBound: Number((microwaveMs * 0.85).toFixed(2)),
      highBound: Number((microwaveMs * 1.15).toFixed(2)),
      metadata: { formula: "km × 3.336 µs/km" },
    });
  }

  // Kept to a single representative case. The cycles-per-stall conversion
  // is worth knowing once; five variants of the same one-step
  // multiplication just crowded out the estimation questions.
  const CPU_CASES = [{ ghz: 4.0, ns: 250 }];
  for (const c of CPU_CASES) {
    const cycles = Math.round(c.ghz * c.ns);
    out.push({
      id: nextId("cpu"),
      question: `How many clock cycles does a ${c.ghz.toFixed(1)} GHz CPU execute during a ${c.ns} ns memory stall?`,
      answer: cycles,
      unit: "cycles",
      explanation: `${c.ghz.toFixed(1)} GHz = ${c.ghz.toFixed(1)} cycles/ns. ${c.ns} ns × ${c.ghz.toFixed(1)} cycles/ns = ${cycles} cycles.`,
      category: "hardware-latency",
      difficulty: 1,
      timeLimitSec: 25,
      lowBound: Math.round(cycles * 0.9),
      highBound: Math.round(cycles * 1.1),
    });
  }
  return out;
}

/**
 * Builds the full procedural technical pool. Dice boards and grid paths are
 * re-rolled every call, so revisiting the menu never shows the same picture
 * twice — everything else is a fixed, verified combinatorial sweep.
 */
export function getProceduralTechnicalQuestions(): TechnicalQuestion[] {
  return [
    ...genDiceQuestions(),
    ...genPathQuestions(),
    ...genPowerFactorialQuestions(),
    ...genWalkQuestions(),
    ...genMarketQuestions(),
    ...genLatencyQuestions(),
  ];
}
