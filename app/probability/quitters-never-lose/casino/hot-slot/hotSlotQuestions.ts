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
    id: "ev-market",
    topic: "ev",
    topicLabel: "Market Maker EV",
    prompt: (o) => 
      `A risk-neutral market maker offers you a perfectly fair contract. If you pay $100 to play, and they pay you exactly the Fair Multiplier (${fmtX(o.fairMultiplier)}) if you survive, what is the Expected Value of your NET PROFIT?`,
    answer: (o) => ({ decimal: 0, tolerance: 0.1, display: "0" }),
    explanation: (o) => 
      `By definition, a 'Fair Multiplier' implies a zero-sum game with no house edge. [P(Win) * Payout] - Initial Bet = 0. Your expected net profit is exactly $0.`
  },
];

export function pickHotSlotQuestion(): HotSlotQuestionInstance {
  return QUESTION_BANK[Math.floor(Math.random() * QUESTION_BANK.length)];
}
