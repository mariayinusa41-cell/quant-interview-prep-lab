// Question bank for XXX's wheel — updated for Quant-level technical screening.
// Focuses on conditional probability, stopping times, variance, and symmetry.
// Multiple phrasings per topic so a run of spins doesn't feel like the same question on repeat.

import type { WheelOdds } from "./hotSlotMath";

export type HotSlotQuestionTopic = "hit" | "safe" | "ev" | "combinatorics" | "gotcha";

export type HotSlotQuestionInstance = {
  id: string;
  topic: HotSlotQuestionTopic;
  topicLabel: string;
  prompt: (o: WheelOdds) => string;
  answer: (o: WheelOdds) => { decimal: number; tolerance: number; display: string };
  explanation: (o: WheelOdds) => string;
  choices?: string[];
};

function fmtX(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
}

const QUESTION_BANK: HotSlotQuestionInstance[] = [
  {
    id: "safe-seq",
    topic: "safe",
    topicLabel: "Sequential Probability",
    prompt: (o) => 
      `Assuming you spin twice in a row without stopping, what is the exact probability of surviving BOTH spins? (Safe numbers are removed once landed on).`,
    answer: (o) => {
      const s = o.activeCount - o.markedCount;
      const prob = s <= 1 ? 0 : (s / o.activeCount) * ((s - 1) / (o.activeCount - 1));
      return { decimal: prob, tolerance: 0.001, display: `${(prob * 100).toFixed(1)}%` };
    },
    explanation: (o) => {
      const s = o.activeCount - o.markedCount;
      return `You need two consecutive safe spins without replacement. P(Safe 1) = ${s}/${o.activeCount}. P(Safe 2) = ${s - 1}/${o.activeCount - 1}. Multiply them together.`;
    },
  },
  {
    id: "hit-seq",
    topic: "hit",
    topicLabel: "Conditional Risk",
    prompt: (o) => 
      `What is the exact probability that you survive THIS spin, but hit one of your ${o.markedCount} marked numbers on the VERY NEXT spin?`,
    answer: (o) => {
      const s = o.activeCount - o.markedCount;
      const prob = o.activeCount <= 1 ? 0 : (s / o.activeCount) * (o.markedCount / (o.activeCount - 1));
      return { decimal: prob, tolerance: 0.001, display: `${(prob * 100).toFixed(1)}%` };
    },
    explanation: (o) => {
      const s = o.activeCount - o.markedCount;
      if (o.activeCount <= 1) return "Only one active number remains, and it is marked, so the next spin is certain to hit it.";
      return `P(Safe 1) = ${s}/${o.activeCount}. If you survive, the wheel shrinks to ${o.activeCount - 1} numbers, but your ${o.markedCount} marked numbers remain. P(Hit 2) = ${o.markedCount}/${o.activeCount - 1}. Multiply them.`;
    },
  },
  {
    id: "ev-stop",
    topic: "ev",
    topicLabel: "Expected Stopping Time",
    prompt: (o) => 
      `If you were forced to keep spinning until you finally hit a marked number, what is the Expected Value (average number) of SAFE spins you would accumulate before dying?`,
    answer: (o) => {
      const s = o.activeCount - o.markedCount;
      const expected = s / (o.markedCount + 1);
      return { decimal: expected, tolerance: 0.05, display: expected.toFixed(2) };
    },
    explanation: (o) => {
      const s = o.activeCount - o.markedCount;
      return `By symmetry, the ${o.markedCount} marked numbers randomly divide the ${s} safe numbers into ${o.markedCount + 1} distinct intervals. The expected length of the first interval (spins before the first hit) is exactly ${s} / (${o.markedCount} + 1).`;
    },
  },
  {
    id: "gotcha-delta",
    topic: "gotcha",
    topicLabel: "Risk Delta",
    prompt: (o) => 
      `If you survive this spin, your probability of dying on the next spin increases. Let N be the active numbers and K be the marked numbers. What is the EXACT absolute mathematical increase in your risk?`,
    choices: ["K / (N*(N-1))", "1 / (N-1)", "K / N", "K / (N-K)"],
    answer: () => ({ decimal: 0, tolerance: 0, display: "K / (N*(N-1))" }),
    explanation: (o) => 
      `Next Spin Risk - Current Risk = K/(N-1) - K/N. Finding a common denominator yields (K*N - K*(N-1)) / (N*(N-1)) = K / (N*(N-1)).`
  },
  {
    id: "comb-perm",
    topic: "combinatorics",
    topicLabel: "Permutations",
    prompt: (o) => 
      `There are ${o.activeCount - o.markedCount} safe numbers remaining. How many distinct, ordered sequences of 2 consecutive safe spins can be drawn from the current wheel?`,
    answer: (o) => {
      const s = o.activeCount - o.markedCount;
      const count = s <= 1 ? 0 : s * (s - 1);
      return { decimal: count, tolerance: 0, display: `${count}` };
    },
    explanation: (o) => {
      const s = o.activeCount - o.markedCount;
      return `This is a Permutation problem, not a Combination problem, because order matters (landing on Safe #4 then Safe #2 is distinct from #2 then #4). P(${s}, 2) = ${s} * ${s - 1} = ${s <= 1 ? 0 : s * (s - 1)}.`;
    },
  },
  {
    // Replaces an older "what's the EV of a fair contract?" question whose
    // answer was 0 straight from the definition of "fair", and which never
    // said whether the multiplier was a total return or a profit. This one
    // uses the multiplier the wheel ACTUALLY offers (which carries the house
    // edge), and states the settlement convention explicitly, so there is a
    // real number to compute and only one way to read the question.
    id: "ev-house-edge",
    topic: "ev",
    topicLabel: "House Edge",
    prompt: (o) =>
      `You stake $100 on this spin at the wheel's offered multiplier of ${fmtX(o.offeredMultiplier)}. ` +
      `Settlement: land safe and your $100 is RETURNED TO YOU MULTIPLIED by ${fmtX(o.offeredMultiplier)}; ` +
      `land on a marked number and you lose the entire $100. ` +
      `What is the expected NET PROFIT of this bet, in dollars?`,
    answer: (o) => {
      const ev = 100 * (o.safeProb.decimal * o.offeredMultiplier - 1);
      return { decimal: ev, tolerance: 0.75, display: `$${ev.toFixed(2)}` };
    },
    explanation: (o) => {
      const ev = 100 * (o.safeProb.decimal * o.offeredMultiplier - 1);
      return (
        `E[return] = P(safe) x 100 x multiplier = ${(o.safeProb.decimal * 100).toFixed(1)}% x $100 x ${o.offeredMultiplier} ` +
        `= $${(o.safeProb.decimal * 100 * o.offeredMultiplier).toFixed(2)}. Net profit subtracts the $100 stake: $${ev.toFixed(2)}. ` +
        `It is negative because the wheel pays ${fmtX(o.offeredMultiplier)} where a fair price would be ${fmtX(o.fairMultiplier)} — that gap is the house edge.`
      );
    },
  },
  {
    // Expected TOTAL spins, including the one that ends the run. Sits next to
    // the existing "safe spins before dying" question (S/(K+1)) and catches
    // the classic off-by-one: the two differ by exactly the fatal spin.
    id: "ev-total-spins",
    topic: "ev",
    topicLabel: "Expected Stopping Time",
    prompt: (o) =>
      `You keep spinning until a marked number ends the run. Counting the final, fatal spin itself, ` +
      `what is the expected TOTAL number of spins the run lasts?`,
    answer: (o) => {
      const expected = (o.activeCount + 1) / (o.markedCount + 1);
      return { decimal: expected, tolerance: 0.05, display: expected.toFixed(2) };
    },
    explanation: (o) => {
      const s = o.activeCount - o.markedCount;
      const expected = (o.activeCount + 1) / (o.markedCount + 1);
      return (
        `The ${o.markedCount} marked numbers cut the ${s} safe numbers into ${o.markedCount + 1} gaps, so the expected number of ` +
        `SAFE spins first is ${s}/${o.markedCount + 1}. Add the fatal spin: ${s}/${o.markedCount + 1} + 1 = ` +
        `(${o.activeCount}+1)/(${o.markedCount}+1) = ${expected.toFixed(2)}.`
      );
    },
  },
  {
    // Pure symmetry: no arithmetic, but you have to see that every marked
    // number is equally likely to be the one that gets you. Answer is 1/K and
    // notably does NOT depend on N — the usual wrong instinct is to involve it.
    id: "symmetry-first-marked",
    topic: "gotcha",
    topicLabel: "Symmetry",
    prompt: (o) =>
      `Of your ${o.markedCount} marked numbers, single out one specific number in advance. ` +
      `What is the probability that THAT number is the first marked number the wheel lands on?`,
    answer: (o) => {
      const prob = o.markedCount === 0 ? 0 : 1 / o.markedCount;
      return { decimal: prob, tolerance: 0.005, display: `${(prob * 100).toFixed(1)}%` };
    },
    explanation: (o) =>
      `By symmetry every marked number is equally likely to be reached first, so it is simply 1/${o.markedCount} = ` +
      `${o.markedCount === 0 ? "n/a" : ((1 / o.markedCount) * 100).toFixed(1)}%. ` +
      `Note it does not depend on the ${o.activeCount} active numbers at all — the safe numbers are removed as you go, ` +
      `but they never break the tie between your marked numbers.`,
  },
  {
    // Extends the existing two-spin survival question by one more spin, which
    // is where people start reusing the same denominator instead of shrinking
    // it each time.
    id: "safe-seq-3",
    topic: "safe",
    topicLabel: "Sequential Probability",
    prompt: (o) =>
      `What is the exact probability of surviving the next THREE spins in a row? ` +
      `(Each safe number you land on is removed from the wheel before the next spin.)`,
    answer: (o) => {
      const s = o.activeCount - o.markedCount;
      const n = o.activeCount;
      const prob = s <= 2 || n <= 2 ? 0 : (s / n) * ((s - 1) / (n - 1)) * ((s - 2) / (n - 2));
      return { decimal: prob, tolerance: 0.001, display: `${(prob * 100).toFixed(1)}%` };
    },
    explanation: (o) => {
      const s = o.activeCount - o.markedCount;
      const n = o.activeCount;
      return (
        `Both the safe count and the total shrink by one after each survival, while your ${o.markedCount} marked numbers stay put: ` +
        `(${s}/${n}) x (${s - 1}/${n - 1}) x (${s - 2}/${n - 2}). The denominator has to shrink too — that is the step most people miss.`
      );
    },
  },
];

export function pickHotSlotQuestion(): HotSlotQuestionInstance {
  return QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
}
