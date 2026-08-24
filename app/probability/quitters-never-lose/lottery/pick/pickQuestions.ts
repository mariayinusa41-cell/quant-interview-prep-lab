// Question bank for Pick 3/4/5 — same QuestionInstance shape used by the
// scratch-off section (prompt/answer/explanation as functions), but driven
// by the player's own PickTemplate instead of a randomly-generated hidden
// one. The player's digit choice IS the math here, so every question below
// is personalized to what they actually picked, not to a hidden prize table.

import type { PickTemplate } from "./pickMath";

export type PickQuestionTopic = "combinatorics" | "ev" | "bayes";

export type PickQuestionInstance = {
  id: string;
  topic: PickQuestionTopic;
  topicLabel: string;
  usesNotation?: boolean;
  prompt: (t: PickTemplate) => string;
  answer: (t: PickTemplate) => { decimal: number; tolerance: number; display: string };
  explanation: (t: PickTemplate) => string;
};

function money(n: number): string {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export const PICK_QUESTION_BANK: PickQuestionInstance[] = [
  {
    id: "pick-ways",
    topic: "combinatorics",
    topicLabel: "Combinatorics",
    prompt: (t) => `You picked ${t.digits.join("")}. In how many different orders could these ${t.n} digits be arranged?`,
    answer: (t) => ({ decimal: t.ways, tolerance: 0, display: `${t.ways}` }),
    explanation: (t) => `${t.n}! adjusted for repeats = ${t.ways} distinct orderings — this is why your Box bet is a "${t.wayLabel}."`,
  },
  {
    id: "pick-box-payout",
    topic: "ev",
    topicLabel: "Expected value",
    prompt: (t) => `The Straight payout for a ${t.n}-digit ticket is ${money(t.straightPayout)}. Given your numbers are a ${t.wayLabel}, what should the Box payout be?`,
    answer: (t) => ({ decimal: t.boxPayout, tolerance: 1, display: money(t.boxPayout) }),
    explanation: (t) => `Box payout = Straight payout ÷ ways = ${money(t.straightPayout)} ÷ ${t.ways} = ${money(t.boxPayout)}.`,
  },
  {
    id: "pick-straight-prob",
    topic: "bayes",
    topicLabel: "Probability",
    prompt: (t) => `What's the probability of hitting Straight with your exact ${t.n} digits, in exact order?`,
    answer: (t) => ({ decimal: t.straightProbDecimal, tolerance: 0.0001, display: t.straightProbFraction }),
    explanation: (t) => `1 winning order out of 10^${t.n} possible draws = ${t.straightProbFraction}.`,
  },
  {
    id: "pick-box-prob",
    topic: "bayes",
    topicLabel: "Probability",
    prompt: (t) => `Given it's a ${t.wayLabel}, what's the probability of hitting Box?`,
    answer: (t) => ({ decimal: t.boxProbDecimal, tolerance: 0.001, display: t.boxProbFraction }),
    explanation: (t) => `${t.ways} winning orders out of 10^${t.n} = ${t.boxProbFraction}.`,
  },
  {
    id: "pick-edge-insight",
    topic: "ev",
    topicLabel: "Expected value / House edge",
    usesNotation: false,
    prompt: (t) =>
      `Straight pays ${money(t.straightPayout)} at odds of ${t.straightProbFraction}. Box pays ${money(t.boxPayout)} at odds of ${t.boxProbFraction}. As a decimal, what's the house edge (1 − EV per dollar) for EACH bet?`,
    answer: () => ({ decimal: 0.5, tolerance: 0.01, display: "0.5 (50%)" }),
    explanation: () =>
      `Both come out to exactly 50% — every play type on this ticket has the identical house edge. The "way" number and payout just redistribute the same expected value across more or fewer winning combinations; they don't change how good or bad the bet is.`,
  },
];
