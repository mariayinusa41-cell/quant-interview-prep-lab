import type { SkillTag } from "../progress/skills";

export type DailyQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  skill: SkillTag;
};

// Answering the daily correctly is the only way a free player earns tokens
// (aside from the 7-day streak spin), so the reward is deliberately equal to
// one base session.
export const DAILY_REWARD = 10;
export const STREAK_TARGET = 7;
export const WHEEL_PRIZES = [10, 15, 20, 25, 40, 60];

export const DAILY_QUESTIONS: DailyQuestion[] = [
  {
    prompt: "You flip a fair coin 3 times. Given that at least one flip is heads, what is the probability all three are heads?",
    choices: ["1/7", "1/8", "1/4", "1/3"],
    answer: 0,
    explanation: "P(all H) = 1/8 and P(at least one H) = 7/8, so the conditional probability is (1/8)/(7/8) = 1/7.",
    skill: "conditional-probability",
  },
  {
    prompt: "A stick of length 1 is broken at a uniformly random point. What is the expected length of the longer piece?",
    choices: ["3/4", "1/2", "2/3", "5/8"],
    answer: 0,
    explanation: "The longer piece has length max(U, 1-U) for U uniform on [0,1], whose expectation is 3/4.",
    skill: "expected-value",
  },
  {
    prompt: "How many distinct arrangements are there of the letters in BANANA?",
    choices: ["60", "120", "720", "360"],
    answer: 0,
    explanation: "6!/(3! for A, 2! for N, 1! for B) = 720/12 = 60.",
    skill: "combinatorics",
  },
  {
    prompt: "X is Normal with mean 10 and variance 4. What is P(X > 10)?",
    choices: ["0.5", "0.68", "0.95", "Cannot be determined"],
    answer: 0,
    explanation: "The Normal distribution is symmetric about its mean, so exactly half the mass lies above 10.",
    skill: "distributions",
  },
  {
    prompt: "You test 20 independent strategies at the 5% significance level, all of them truly worthless. What is the expected number that appear significant?",
    choices: ["1", "0", "5", "20"],
    answer: 0,
    explanation: "Each has a 5% false-positive rate, so the expectation is 20 x 0.05 = 1. This is why multiple-comparison correction exists.",
    skill: "selection-bias",
  },
  {
    prompt: "A symmetric 2x2 matrix has trace 4 and determinant 3. Is it positive definite?",
    choices: ["Yes", "No", "Only if it is diagonal", "Not enough information"],
    answer: 0,
    explanation: "Eigenvalues sum to 4 and multiply to 3, giving 1 and 3 — both positive, so it is positive definite.",
    skill: "linear-algebra",
  },
  {
    prompt: "What is the worst-case time complexity of binary search on a sorted array of n elements?",
    choices: ["O(log n)", "O(n)", "O(n log n)", "O(1)"],
    answer: 0,
    explanation: "Each comparison halves the remaining range, so the number of steps is logarithmic in n.",
    skill: "complexity",
  },
  {
    prompt: "A Monte Carlo estimate has standard error s. Roughly how many more samples are needed to halve it?",
    choices: ["4x as many", "2x as many", "8x as many", "16x as many"],
    answer: 0,
    explanation: "Standard error scales as 1/sqrt(n), so cutting it in half requires four times the samples.",
    skill: "monte-carlo",
  },
  {
    prompt: "In a sealed-bid first-price auction against one rival with values uniform on [0,1], the symmetric equilibrium bid is:",
    choices: ["Half your value", "Your full value", "Two-thirds of your value", "Zero"],
    answer: 0,
    explanation: "With one rival and uniform values, the symmetric Bayes-Nash equilibrium is to bid v/2.",
    skill: "game-theory",
  },
  {
    prompt: "Roughly how many piano tuners work in a city of 5 million people?",
    choices: ["About 100", "About 5", "About 10,000", "About 500,000"],
    answer: 0,
    explanation: "Fermi estimate: ~1M households, ~1 in 20 owns a piano tuned yearly = 50k tunings, at ~500 tunings per tuner per year gives ~100.",
    skill: "estimation",
  },
];

/** Local calendar day, used to gate the daily to one attempt. */
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Days between two day-keys; NaN-safe and used for streak continuity. */
export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return Number.NaN;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/**
 * Everyone gets the same question on the same date, and it rotates daily.
 * Derived from the date rather than stored so it needs no server.
 */
export function questionForDay(key = todayKey()): DailyQuestion {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return DAILY_QUESTIONS[hash % DAILY_QUESTIONS.length];
}
