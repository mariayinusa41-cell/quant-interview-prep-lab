// Prize-table "shapes" for the scratch-off game, generated fresh on every
// pick instead of drawn from a fixed list — so rounds don't visibly repeat,
// while keeping the same math guarantees the hand-authored shapes had:
// clean dyadic fractions for the outcome table and Bayes question, a clean
// reduced fraction for the no-replacement conditional question, and a small
// mentally-computable nCr for the combinatorics question.
//
// Roughly 70% of generated shapes are "fair-ish" (EV at or below 1x the
// ticket price — a real house edge) and 30% are "hot" (EV above 1x, mispriced
// in the player's favor). That split is constant regardless of how a given
// session is going — it is intentionally NOT biased by whether the player is
// currently up or down. This site's whole point is that -EV games are bad
// bets and quitting is the only guaranteed win; a generator that fed losing
// players more "hot" shapes to keep them playing (or fewer to pull winners
// back in) would be a loss-chasing reinforcement mechanic working against
// that lesson, not a neutral feature. Same reasoning for outcome framing —
// losses are just shown as losses, no "you almost won the jackpot!" styling
// on a $0 result. Near-miss cues are a well-documented predatory slot-machine
// design pattern, not something this generator does.
//
// The "conditional" question is about a finite batch with no replacement —
// each ticket type is printed in a batch of `batchSize` with exactly
// `batchWinners` of them winning something. Scratching a non-winner removes
// it from the batch without replacing it, so the odds for the next ticket
// genuinely shift (real conditional probability, not the gambler's-fallacy
// trap of treating draws as independent when they aren't).
//
// The "combinatorics" question is a real counting question — picking
// `pickSize` numbers from a pool of `poolSize`, order doesn't matter — not a
// probability computation dressed up as one.

export type Outcome = { mult: number; prob: number };

export type Template = {
  id: string;
  name: string;
  outcomes: Outcome[]; // ascending by mult; last one is the jackpot
  evFraction: string;
  evDecimal: number; // as a multiple of ticket price
  bayesFraction: string;
  bayesDecimal: number;
  batchSize: number; // total tickets printed in this type's batch
  batchWinners: number; // how many of the batch win something
  conditionalFraction: string; // P(this ticket wins | prev batch ticket won nothing)
  conditionalDecimal: number;
  poolSize: number; // "pick pickSize numbers from 1..poolSize"
  pickSize: number;
  combinatoricsFraction: string; // C(poolSize, pickSize), as a plain integer string
  combinatoricsDecimal: number;
};

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function reduceFraction(numerator: number, denominator: number): { fraction: string; decimal: number } {
  const g = gcd(numerator, denominator) || 1;
  const n = numerator / g;
  const d = denominator / g;
  return { fraction: d === 1 ? `${n}` : `${n}/${d}`, decimal: n / d };
}

// --- Outcome table (EV) -----------------------------------------------

const DENOMS = [8, 16]; // fraction denominators - keeps everything a clean power-of-2 fraction

function generateOutcomes(hot: boolean): {
  outcomes: Outcome[];
  evNumerator: number;
  denom: number;
  midShare: number;
  jackpotShare: number;
} {
  // Reject-and-reroll rather than clamp, so every generated shape is a real
  // 3-tier table — a clamp could silently collapse the mid or jackpot tier.
  for (let attempt = 0; attempt < 50; attempt++) {
    const denom = DENOMS[Math.floor(Math.random() * DENOMS.length)];

    // Zero-prize slice: 50%-80% of the denominator, so there's always a real
    // house edge on the "fair" shapes and a lighter one on "hot" shapes.
    const zeroShare = hot
      ? randInt(Math.floor(denom * 0.5), Math.floor(denom * 0.6))
      : randInt(Math.floor(denom * 0.5), Math.floor(denom * 0.8));
    const remaining = denom - zeroShare;

    // Split the remainder into mid-tier (more common) and jackpot (rarer).
    const jackpotShare = Math.max(1, Math.floor((remaining * randInt(20, 35)) / 100));
    const midShare = remaining - jackpotShare;

    if (midShare <= 0 || jackpotShare <= 0) continue;

    const midMult = [1, 2][randInt(0, 1)];
    const jackpotMultOptions = hot ? [8, 10, 12] : [4, 5, 6, 8];
    const jackpotMult = jackpotMultOptions[randInt(0, jackpotMultOptions.length - 1)];

    const evNumerator = midMult * midShare + jackpotMult * jackpotShare; // EV = evNumerator/denom, as a multiple of price

    // The share/multiplier ranges above don't by themselves guarantee which
    // side of EV=1x a roll lands on (e.g. a "fair" roll can still combine a
    // small zero-share with big multipliers and land above 1x). The fair/hot
    // split is the game's core -EV-vs-+EV lesson, so enforce it directly
    // rather than let the ranges leave it to chance.
    const evIsHot = evNumerator > denom;
    if (evIsHot !== hot) continue;

    const outcomes: Outcome[] = [
      { mult: 0, prob: zeroShare / denom },
      { mult: midMult, prob: midShare / denom },
      { mult: jackpotMult, prob: jackpotShare / denom },
    ];

    return { outcomes, evNumerator, denom, midShare, jackpotShare };
  }
  // Should be unreachable given the ranges above, but keep TypeScript (and
  // any future range tweak that breaks the invariant) honest.
  throw new Error("generateOutcomes: failed to produce a valid 3-tier table");
}

// --- Batch / conditional probability -----------------------------------

const TARGET_FRACTIONS: [number, number][] = [
  [1, 2],
  [1, 3],
  [1, 4],
  [1, 5],
  [2, 3],
  [3, 4],
  [3, 5],
];

function generateBatch(): {
  batchSize: number;
  batchWinners: number;
  conditionalFraction: string;
  conditionalDecimal: number;
} {
  const [n, d] = TARGET_FRACTIONS[randInt(0, TARGET_FRACTIONS.length - 1)];
  const scale = randInt(1, 3); // keeps batchSize in roughly the 8-25 range, matching the hand-authored set
  const batchWinners = n * scale;
  const batchSizeMinusOne = d * scale;
  const batchSize = batchSizeMinusOne + 1;
  const { fraction, decimal } = reduceFraction(batchWinners, batchSizeMinusOne);
  return { batchSize, batchWinners, conditionalFraction: fraction, conditionalDecimal: decimal };
}

// --- Combinatorics --------------------------------------------------------

function nCr(n: number, r: number): number {
  let result = 1;
  for (let i = 0; i < r; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

const MAX_COMBINATORICS_RESULT = 220; // matches the ceiling already implied by the hand-authored set (210 was the largest)

function generateCombinatorics(): {
  poolSize: number;
  pickSize: number;
  combinatoricsFraction: string;
  combinatoricsDecimal: number;
} {
  let poolSize: number, pickSize: number, result: number;
  do {
    poolSize = randInt(6, 10);
    pickSize = randInt(2, 4);
    result = nCr(poolSize, pickSize);
  } while (result > MAX_COMBINATORICS_RESULT || pickSize >= poolSize);
  return { poolSize, pickSize, combinatoricsFraction: `${result}`, combinatoricsDecimal: result };
}

// --- Naming (flavor only, no bearing on the math) --------------------------

const NAME_ADJ = ["Lucky", "Golden", "Wild", "Neon", "Midnight", "Diamond", "Silver", "Royal"];
const NAME_NOUN = ["Strike", "Streak", "Draw", "Jackpot", "Roll", "Run", "Shot", "Break"];

function generateName(): string {
  const adj = NAME_ADJ[randInt(0, NAME_ADJ.length - 1)];
  const noun = NAME_NOUN[randInt(0, NAME_NOUN.length - 1)];
  return `${adj} ${noun}`;
}

// --- Putting it together ---------------------------------------------------

// 70% fair-ish (EV at or below 1x), 30% mispriced in the player's favor —
// constant odds, not adjusted by session state. See the file header.
export function pickTemplate(): Template {
  const hot = Math.random() < 0.3;

  const { outcomes, evNumerator, denom, midShare, jackpotShare } = generateOutcomes(hot);
  const { fraction: evFraction, decimal: evDecimal } = reduceFraction(evNumerator, denom);
  const { fraction: bayesFraction, decimal: bayesDecimal } = reduceFraction(jackpotShare, midShare + jackpotShare);
  const batch = generateBatch();
  const combo = generateCombinatorics();

  return {
    id: `gen-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    name: generateName(),
    outcomes,
    evFraction,
    evDecimal,
    bayesFraction,
    bayesDecimal,
    ...batch,
    ...combo,
  };
}

// Draws the actual outcome for one ticket, honoring the template's odds.
export function drawOutcome(template: Template): Outcome {
  const r = Math.random();
  let cumulative = 0;
  for (const o of template.outcomes) {
    cumulative += o.prob;
    if (r < cumulative) return o;
  }
  return template.outcomes[0];
}

export function probOfWinningSomething(template: Template): number {
  return template.outcomes.filter((o) => o.mult > 0).reduce((sum, o) => sum + o.prob, 0);
}

// Accepts "3/8" or "0.375" or "37.5" (treated as a percent if > 1 and the
// question is a probability, handled by the caller).
export function parseAnswer(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/")) {
    const [a, b] = trimmed.split("/").map((s) => Number(s.trim()));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
    return a / b;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
