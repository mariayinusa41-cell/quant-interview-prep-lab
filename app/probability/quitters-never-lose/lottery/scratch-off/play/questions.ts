// The question bank for a scratch-off round. 6 topics × 3 phrasings (A, B, C)
// = 18 distinct questions. "C" variants use formal probability notation
// (P(A|B), E[X], C(n,r), X ~ Geometric(p)) — the way these actually get
// posed in textbook-style quant-interview material — while A/B stay in
// plain English. `buildQuestionSet` guarantees every topic appears at least
// once per session and that exactly 1-3 notation questions show up, by
// construction rather than by chance.
//
// `classic` is adapted from three well-known, public-domain probability
// puzzles (Monty Hall, the Birthday Problem, the Coupon Collector's Problem)
// — decades-old mathematical concepts appearing in dozens of textbooks, not
// copied from any one source. The scratch-off framing, wording, and numbers
// here are original. Unlike the other 15 questions these 3 don't pull from
// the round's randomly-generated Template — they're fixed scenarios, so they
// read identically every time they come up. Fine for occasional appearances
// (1 of 18 possible picks per slot); would get stale if forced constantly.

import { type Template, probOfWinningSomething, reduceFraction } from "./templates";

export type Topic = "ev" | "bayes" | "conditional" | "combinatorics" | "geometric" | "classic";
export type Variant = "A" | "B" | "C";

export type QuestionInstance = {
  id: string; // `${topic}-${variant}`, stable and unique across the bank
  topic: Topic;
  variant: Variant;
  usesNotation: boolean; // true only for "C" variants
  topicLabel: string;
  prompt: (t: Template, price: number) => string;
  answer: (t: Template, price: number) => { decimal: number; tolerance: number; display: string };
  explanation: (t: Template, price: number) => string;
};

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Outcome probabilities are always clean dyadic fractions (x/8 or x/16) by
// generator design — reduce whichever denominator matches exactly.
function fractionOf(prob: number): string {
  for (const denom of [8, 16]) {
    const numerator = Math.round(prob * denom);
    if (Math.abs(numerator / denom - prob) < 1e-9) {
      const g = gcd(numerator, denom) || 1;
      return denom / g === 1 ? `${numerator / g}` : `${numerator / g}/${denom / g}`;
    }
  }
  return prob.toString();
}

// Outcome probabilities are always multiples of 1/8 or 1/16, so converting
// to sixteenths uniformly gives a clean fraction regardless of which
// denominator the template used.
function winShare16(template: Template): number {
  return Math.round(probOfWinningSomething(template) * 16);
}

export const QUESTION_BANK: QuestionInstance[] = [
  // --- EV -------------------------------------------------------------
  {
    id: "ev-A",
    topic: "ev",
    variant: "A",
    usesNotation: false,
    topicLabel: "Expected value",
    prompt: () => "Using the odds above, what's the expected payout of this ticket, in dollars?",
    answer: (t, price) => ({
      decimal: t.evDecimal * price,
      tolerance: price * 0.03 + 0.1,
      display: fmt(t.evDecimal * price),
    }),
    explanation: (t, price) => {
      const terms = t.outcomes
        .filter((o) => o.mult > 0)
        .map((o) => `${fractionOf(o.prob)} × ${fmt(o.mult * price)}`)
        .join(" + ");
      return `E[Payout] = ${terms} = ${t.evFraction} × ${fmt(price)} = ${fmt(t.evDecimal * price)}.`;
    },
  },
  {
    id: "ev-B",
    topic: "ev",
    variant: "B",
    usesNotation: false,
    topicLabel: "Expected value",
    prompt: (_t, price) => `What's the expected profit of this ticket — expected payout minus the ${fmt(price)} price?`,
    answer: (t, price) => {
      const profit = t.evDecimal * price - price;
      return { decimal: profit, tolerance: price * 0.03 + 0.1, display: profit >= 0 ? `+${fmt(profit)}` : `-${fmt(Math.abs(profit))}` };
    },
    explanation: (t, price) => {
      const profit = t.evDecimal * price - price;
      return `E[Profit] = E[Payout] − price = ${fmt(t.evDecimal * price)} − ${fmt(price)} = ${profit >= 0 ? "+" : "-"}${fmt(Math.abs(profit))}.`;
    },
  },
  {
    id: "ev-C",
    topic: "ev",
    variant: "C",
    usesNotation: true,
    topicLabel: "Expected value",
    prompt: () => "Let X be this ticket's payout. Using the table above, compute E[X].",
    answer: (t, price) => ({
      decimal: t.evDecimal * price,
      tolerance: price * 0.03 + 0.1,
      display: fmt(t.evDecimal * price),
    }),
    explanation: (t, price) => `E[X] = Σ x·P(X=x) = ${t.evFraction} × price = ${fmt(t.evDecimal * price)}.`,
  },

  // --- Bayes ------------------------------------------------------------
  {
    id: "bayes-A",
    topic: "bayes",
    variant: "A",
    usesNotation: false,
    topicLabel: "Conditional probability / Bayes",
    prompt: () => "Given this ticket wins something (more than $0), what's the probability it's the top prize?",
    answer: (t) => ({ decimal: t.bayesDecimal, tolerance: 0.01, display: t.bayesFraction }),
    explanation: (t) => `P(top prize | win) = P(top prize) / P(win) = ${t.bayesFraction}.`,
  },
  {
    id: "bayes-B",
    topic: "bayes",
    variant: "B",
    usesNotation: false,
    topicLabel: "Conditional probability / Bayes",
    prompt: () => "What's the probability this ticket wins nothing at all?",
    answer: (t) => {
      const r = reduceFraction(Math.round(t.outcomes[0].prob * 16), 16);
      return { decimal: r.decimal, tolerance: 0.01, display: r.fraction };
    },
    explanation: (t) => {
      const r = reduceFraction(Math.round(t.outcomes[0].prob * 16), 16);
      return `P(win nothing) = P(X = 0) = ${r.fraction}.`;
    },
  },
  {
    id: "bayes-C",
    topic: "bayes",
    variant: "C",
    usesNotation: true,
    topicLabel: "Conditional probability / Bayes",
    prompt: () => "Let A = {wins something}, B = {wins the top prize}. Since B ⊆ A, compute P(B|A) = P(B)/P(A).",
    answer: (t) => ({ decimal: t.bayesDecimal, tolerance: 0.01, display: t.bayesFraction }),
    explanation: (t) => `P(B|A) = P(B)/P(A) = ${t.bayesFraction}.`,
  },

  // --- Conditional (finite batch, no replacement) ------------------------
  {
    id: "conditional-A",
    topic: "conditional",
    variant: "A",
    usesNotation: false,
    topicLabel: "Conditional probability (no replacement)",
    prompt: (t) =>
      `This ticket came from a batch of ${t.batchSize}, and exactly ${t.batchWinners} of them win something. You just scratched the previous ticket from this batch and it won nothing. Given that, what's the probability THIS ticket wins something?`,
    answer: (t) => ({ decimal: t.conditionalDecimal, tolerance: 0.01, display: t.conditionalFraction }),
    explanation: (t) =>
      `${t.batchWinners} winners remain among ${t.batchSize - 1} tickets. P = ${t.batchWinners}/${t.batchSize - 1} = ${t.conditionalFraction}.`,
  },
  {
    id: "conditional-B",
    topic: "conditional",
    variant: "B",
    usesNotation: false,
    topicLabel: "Conditional probability (no replacement)",
    prompt: (t) => `Same batch of ${t.batchSize}. After that non-winning ticket is removed, how many winners remain in the batch?`,
    answer: (t) => ({ decimal: t.batchWinners, tolerance: 0, display: `${t.batchWinners}` }),
    explanation: (t) =>
      `Removing a non-winner doesn't remove a winner — ${t.batchWinners} winners still remain, just among ${t.batchSize - 1} tickets now instead of ${t.batchSize}.`,
  },
  {
    id: "conditional-C",
    topic: "conditional",
    variant: "C",
    usesNotation: true,
    topicLabel: "Conditional probability (no replacement)",
    prompt: (t) =>
      `Let W = winners remaining, N = tickets remaining after one non-winner is removed from a batch of ${t.batchSize} with ${t.batchWinners} winners. Compute P(next ticket wins) = W/N.`,
    answer: (t) => ({ decimal: t.conditionalDecimal, tolerance: 0.01, display: t.conditionalFraction }),
    explanation: (t) => `W = ${t.batchWinners}, N = ${t.batchSize - 1}. P = W/N = ${t.conditionalFraction}.`,
  },

  // --- Combinatorics ------------------------------------------------------
  {
    id: "combinatorics-A",
    topic: "combinatorics",
    variant: "A",
    usesNotation: false,
    topicLabel: "Combinatorics",
    prompt: (t) => `This ticket has you pick ${t.pickSize} numbers from 1–${t.poolSize} (order doesn't matter). How many different number combinations are possible?`,
    answer: (t) => ({ decimal: t.combinatoricsDecimal, tolerance: 0, display: t.combinatoricsFraction }),
    explanation: (t) => `C(${t.poolSize}, ${t.pickSize}) = ${t.combinatoricsFraction}.`,
  },
  {
    id: "combinatorics-B",
    topic: "combinatorics",
    variant: "B",
    usesNotation: false,
    topicLabel: "Combinatorics",
    prompt: (t) =>
      `Of all ${t.combinatoricsFraction} possible combinations for this ticket, how many would NOT match the winning numbers (exactly one specific combination wins)?`,
    answer: (t) => ({ decimal: t.combinatoricsDecimal - 1, tolerance: 0, display: `${t.combinatoricsDecimal - 1}` }),
    explanation: (t) => `Total combinations minus the one winning combination: ${t.combinatoricsFraction} − 1 = ${t.combinatoricsDecimal - 1}.`,
  },
  {
    id: "combinatorics-C",
    topic: "combinatorics",
    variant: "C",
    usesNotation: true,
    topicLabel: "Combinatorics",
    prompt: (t) => `Compute C(${t.poolSize}, ${t.pickSize}) = ${t.poolSize}! / (${t.pickSize}!(${t.poolSize}−${t.pickSize})!).`,
    answer: (t) => ({ decimal: t.combinatoricsDecimal, tolerance: 0, display: t.combinatoricsFraction }),
    explanation: (t) => `C(${t.poolSize}, ${t.pickSize}) = ${t.combinatoricsFraction}.`,
  },

  // --- Geometric (expected tickets to first win) --------------------------
  {
    id: "geometric-A",
    topic: "geometric",
    variant: "A",
    usesNotation: false,
    topicLabel: "Expected value (geometric distribution)",
    prompt: () => "On average, how many of these tickets would you expect to buy before winning something?",
    answer: (t) => {
      const r = reduceFraction(16, winShare16(t));
      return { decimal: r.decimal, tolerance: 0.05, display: r.fraction };
    },
    explanation: (t) => {
      const w = winShare16(t);
      const r = reduceFraction(16, w);
      return `P(win something) = ${w}/16. E[tickets to first win] = 1/P = 16/${w} = ${r.fraction}.`;
    },
  },
  {
    id: "geometric-B",
    topic: "geometric",
    variant: "B",
    usesNotation: false,
    topicLabel: "Expected value (geometric distribution)",
    prompt: () =>
      "What's the probability your first win happens on exactly your SECOND ticket of this type (i.e., you lose the first, win the second)?",
    answer: (t) => {
      const w = winShare16(t);
      const r = reduceFraction((16 - w) * w, 256);
      return { decimal: r.decimal, tolerance: 0.01, display: r.fraction };
    },
    explanation: (t) => {
      const w = winShare16(t);
      const r = reduceFraction((16 - w) * w, 256);
      return `P(lose, then win) = (1 − p) × p = ${16 - w}/16 × ${w}/16 = ${r.fraction}.`;
    },
  },
  {
    id: "geometric-C",
    topic: "geometric",
    variant: "C",
    usesNotation: true,
    topicLabel: "Expected value (geometric distribution)",
    prompt: () => "Let X ~ Geometric(p) be the number of tickets bought until the first win, where p = P(win something). Compute E[X] = 1/p.",
    answer: (t) => {
      const r = reduceFraction(16, winShare16(t));
      return { decimal: r.decimal, tolerance: 0.05, display: r.fraction };
    },
    explanation: (t) => {
      const w = winShare16(t);
      const r = reduceFraction(16, w);
      return `p = ${w}/16. E[X] = 1/p = 16/${w} = ${r.fraction}.`;
    },
  },

  // --- Classic puzzle adaptations (template-independent) ------------------
  {
    id: "classic-A",
    topic: "classic",
    variant: "A",
    usesNotation: false,
    topicLabel: "Classic probability puzzle",
    prompt: (t, price) =>
      `This ticket has 3 hidden panels. Exactly one hides the jackpot (${t.outcomes[t.outcomes.length - 1].mult}x, or ${
        price ? fmt(t.outcomes[t.outcomes.length - 1].mult * price) : "the top prize"
      }) — the other two are empty. You pick Panel 1. Before scratching it, the game reveals that Panel 3 is empty. If you switch your pick to Panel 2 instead of staying with Panel 1, what's the probability THAT panel holds the jackpot?`,
    answer: () => ({ decimal: 2 / 3, tolerance: 0.01, display: "2/3" }),
    explanation: () =>
      `Your original pick only had a 1/3 chance of being right, and revealing an empty panel doesn't change that — it just concentrates the other 2/3 of the probability onto the one remaining unopened panel. Switching wins 2/3 of the time; staying only wins 1/3.`,
  },
  {
    id: "classic-B",
    topic: "classic",
    variant: "B",
    usesNotation: false,
    topicLabel: "Classic probability puzzle",
    prompt: () =>
      `This scratch-off comes in 6 different ticket designs, evenly mixed into every roll. If 3 friends each grab one ticket at random, what's the probability at least two of them end up with the same design?`,
    answer: () => ({ decimal: 4 / 9, tolerance: 0.01, display: "4/9" }),
    explanation: () =>
      `Easier to find P(all different) first: 6/6 × 5/6 × 4/6 = 120/216 = 5/9. So P(at least one match) = 1 − 5/9 = 4/9 — higher than most people's gut guess, same surprise as the classic birthday problem.`,
  },
  {
    id: "classic-C",
    topic: "classic",
    variant: "C",
    usesNotation: true,
    topicLabel: "Classic probability puzzle",
    prompt: () =>
      `There are 3 different ticket designs, each equally likely on every purchase. Let T = the number of tickets you'd need to buy to collect all 3 designs at least once. Using E[T] = n × H_n, where H_n = 1 + 1/2 + ... + 1/n, compute E[T] for n = 3.`,
    answer: () => ({ decimal: 5.5, tolerance: 0.1, display: "5.5" }),
    explanation: () =>
      `H_3 = 1 + 1/2 + 1/3 = 11/6. E[T] = 3 × 11/6 = 5.5 — on average you'd need to buy 5.5 tickets before you'd seen all 3 designs at least once.`,
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TOPICS: Topic[] = ["ev", "bayes", "conditional", "combinatorics", "geometric", "classic"];

export function buildQuestionSet(count: 7 | 13): QuestionInstance[] {
  const notationTarget = Math.min(3, Math.max(1, Math.floor(Math.random() * 3) + 1)); // 1, 2, or 3
  const notationTopics = new Set(shuffle(TOPICS).slice(0, notationTarget));

  const set: QuestionInstance[] = [];
  const usedIds = new Set<string>();

  // Guarantee one question per topic first (6 slots), using the "C" variant
  // for topics chosen above, a random A/B otherwise.
  for (const topic of TOPICS) {
    const variant: Variant = notationTopics.has(topic) ? "C" : Math.random() < 0.5 ? "A" : "B";
    const q = QUESTION_BANK.find((q) => q.topic === topic && q.variant === variant)!;
    set.push(q);
    usedIds.add(q.id);
  }

  // Fill remaining slots from whatever's left, shuffled so order doesn't
  // correlate with topic. Notation ("C") variants are excluded here — the
  // guaranteed pass above already locked in exactly `notationTarget` of
  // them; drawing more from this pool for topics that weren't chosen would
  // silently push the session's notation count past the [1,3] invariant.
  const remainingPool = shuffle(QUESTION_BANK.filter((q) => !usedIds.has(q.id) && q.variant !== "C"));
  while (set.length < count && remainingPool.length > 0) {
    const q = remainingPool.pop()!;
    set.push(q);
    usedIds.add(q.id);
  }

  return shuffle(set); // randomize final order
}
