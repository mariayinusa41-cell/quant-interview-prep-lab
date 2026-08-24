// Likelihood Ranking — the "which is most/least likely" screen question.
//
// Distinct from Fermi (magnitude guessing) and Technical Estimation (a tight
// numeric answer): here you're given several claims — a trend table, a set
// of distributions, a handful of dice/card/urn events — and have to order
// them by probability, most likely first. This is the format behind
// "Student B is more likely to beat Student A on Test 6" and "which car
// model is most likely to price in the $39k-$41k band" style screens.

export type ProbQuestionType = "rank-order" | "most-likely" | "least-likely" | "comparison";

export type ProbCategory =
  | "student-performance"
  | "distribution-density"
  | "dice-and-cards"
  | "poisson-arrivals"
  | "bayesian-urns";

export type OptionItem = {
  id: string;
  label: string;
  probValue: number; // Exact or simulated probability [0.0 - 1.0]
  formattedProb: string; // e.g. "51.8%"
  rationale: string;
};

export type TableDataContext = {
  columns: string[];
  rows: Array<{
    name: string;
    values: (number | string)[];
  }>;
};

export type DistributionContext = {
  items: Array<{
    name: string;
    type: "Normal" | "Uniform" | "Bimodal" | "Exponential";
    meanOrCenter: number;
    spreadOrStdDev: number;
    description: string;
  }>;
  targetRange: [number, number];
};

export type ProbabilityRankingQuestion = {
  id: string;
  category: ProbCategory;
  type: ProbQuestionType;
  title: string;
  scenarioText: string;
  difficulty: 1 | 2 | 3;
  timeLimitSec: number;
  tableData?: TableDataContext;
  distributionData?: DistributionContext;
  options: OptionItem[]; // The items to rank or pick from
  correctRankOrder: string[]; // Option IDs ordered from MOST likely (index 0) to LEAST likely
  explanation: string;
};

/**
 * Builds an option's correctRankOrder from actual probValues — never trust
 * the order options happen to be listed in. A generator earlier in this
 * feature's draft assumed a fixed input ordering was already sorted by
 * probability and it wasn't for every branch, which silently produced a
 * wrong answer key. Always deriving it here removes that whole class of bug.
 */
export function rankOrderFromOptions(options: OptionItem[]): string[] {
  return [...options].sort((a, b) => b.probValue - a.probValue).map((o) => o.id);
}

// ---------- Scoring ----------
// A 3/4-item ranking task deserves partial credit, not just exact-match vs
// fail: pairwise concordance (a simplified Kendall's tau) counts how many
// of the C(n,2) pairs the player got in the right relative order.
export function scoreRanking(
  userOrder: string[],
  correctOrder: string[]
): { points: 0 | 1 | 2 | 3; label: string; concordantPairs: number; totalPairs: number; pct: number } {
  const n = correctOrder.length;
  const rank = new Map(correctOrder.map((id, i) => [id, i]));
  let concordant = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      total++;
      const a = userOrder[i];
      const b = userOrder[j];
      const ra = rank.get(a);
      const rb = rank.get(b);
      if (ra !== undefined && rb !== undefined && ra < rb) concordant++;
    }
  }
  const pct = total > 0 ? concordant / total : 0;
  if (pct === 1) return { points: 3, label: "Bullseye — perfect ranking", concordantPairs: concordant, totalPairs: total, pct };
  if (pct >= 0.75) return { points: 2, label: "Tight — nearly right", concordantPairs: concordant, totalPairs: total, pct };
  if (pct >= 0.5) return { points: 1, label: "Partial credit", concordantPairs: concordant, totalPairs: total, pct };
  return { points: 0, label: "Off the mark", concordantPairs: concordant, totalPairs: total, pct };
}

// ===========================================================================
// Hand-curated, individually verified prompts — always in the pool.
// ===========================================================================

export const curatedProbabilityQuestions: ProbabilityRankingQuestion[] = [
  // --- STUDENT PERFORMANCE & TREND EXTRAPOLATION ---
  {
    id: "prob-core-1",
    category: "student-performance",
    type: "rank-order",
    title: "Test Score Prediction (Test 6)",
    scenarioText:
      "Three students have completed Tests 1 through 5. Based on their historical scores below, rank the following three predictions for Test 6 from MOST LIKELY to LEAST LIKELY.",
    difficulty: 2,
    timeLimitSec: 45,
    tableData: {
      columns: ["Student", "Test 1", "Test 2", "Test 3", "Test 4", "Test 5"],
      rows: [
        { name: "Student A (Consistent)", values: [81, 82, 80, 83, 81] },
        { name: "Student B (Upward Trend)", values: [64, 71, 78, 85, 92] },
        { name: "Student C (Volatile)", values: [52, 96, 55, 94, 53] },
      ],
    },
    options: [
      {
        id: "opt-1",
        label: "Student B scores higher than Student A on Test 6",
        probValue: 0.98,
        formattedProb: "~98%",
        rationale:
          "Student B shows a +7 pt/test linear trend (projected Test 6 ≈ 99). Student A is tightly clustered at 81.4 (std ≈ 1.1). P(B > A) is near certain.",
      },
      {
        id: "opt-2",
        label: "Student C scores 90 or higher on Test 6",
        probValue: 0.4,
        formattedProb: "~40%",
        rationale:
          "Student C exhibits an alternating bimodal pattern (50s vs 90s), with ~40% empirical frequency of scoring >90.",
      },
      {
        id: "opt-3",
        label: "Student A scores 90 or higher on Test 6",
        probValue: 0.001,
        formattedProb: "<0.1%",
        rationale:
          "Student A's mean is 81.4 with standard deviation σ ≈ 1.1. A score of 90 requires Z = (90 - 81.4)/1.1 ≈ +7.8σ, which is statistically impossible.",
      },
    ],
    correctRankOrder: ["opt-1", "opt-2", "opt-3"],
    explanation:
      "1. Student B's strong upward momentum puts their projected score well above Student A's stable ~81 (P ≈ 98%).\n2. Student C has reached >90 on 2 of 5 tests (P ≈ 40%).\n3. Student A has σ ≈ 1.1, making a jump to 90 an extreme +7.8σ outlier (P < 0.1%).",
  },

  // --- GAUSSIAN CAR PRICE DENSITY IN A TARGET RANGE ---
  {
    id: "prob-core-2",
    category: "distribution-density",
    type: "rank-order",
    title: "Car Price Range Likelihood ($39k - $41k)",
    scenarioText:
      "A dealership models selling prices for 4 different vehicle models with the distributions below. Rank the models from MOST LIKELY to LEAST LIKELY to sell for a price between $39,000 and $41,000.",
    difficulty: 2,
    timeLimitSec: 40,
    distributionData: {
      targetRange: [39000, 41000],
      items: [
        { name: "Sedan Alpha", type: "Normal", meanOrCenter: 40000, spreadOrStdDev: 1000, description: "Normal(μ = $40,000, σ = $1,000)" },
        { name: "SUV Beta", type: "Normal", meanOrCenter: 40000, spreadOrStdDev: 5000, description: "Normal(μ = $40,000, σ = $5,000)" },
        { name: "Truck Delta", type: "Uniform", meanOrCenter: 40000, spreadOrStdDev: 20000, description: "Uniform[$30,000, $50,000]" },
        { name: "Coupe Gamma", type: "Normal", meanOrCenter: 35000, spreadOrStdDev: 2000, description: "Normal(μ = $35,000, σ = $2,000)" },
      ],
    },
    options: [
      {
        id: "sedan-alpha",
        label: "Sedan Alpha: Normal(μ = $40k, σ = $1k)",
        probValue: 0.6827,
        formattedProb: "68.3%",
        rationale: "The target window [$39k, $41k] is exactly [μ − 1σ, μ + 1σ], capturing 68.3% of the normal density.",
      },
      {
        id: "suv-beta",
        label: "SUV Beta: Normal(μ = $40k, σ = $5k)",
        probValue: 0.1585,
        formattedProb: "15.9%",
        rationale: "Target window is [μ − 0.2σ, μ + 0.2σ]. That's about 15.9% of the density.",
      },
      {
        id: "truck-delta",
        label: "Truck Delta: Uniform[$30k, $50k]",
        probValue: 0.1,
        formattedProb: "10.0%",
        rationale: "Window width ($2,000) / total range ($20,000) = 10.0% — uniform density doesn't care where the window sits.",
      },
      {
        id: "coupe-gamma",
        label: "Coupe Gamma: Normal(μ = $35k, σ = $2k)",
        probValue: 0.0214,
        formattedProb: "2.1%",
        rationale: "$39k–$41k is 2σ to 3σ above the mean ($35k): P(2σ < Z < 3σ) = Φ(3) − Φ(2) ≈ 99.87% − 97.72% ≈ 2.1%.",
      },
    ],
    correctRankOrder: ["sedan-alpha", "suv-beta", "truck-delta", "coupe-gamma"],
    explanation:
      "When a target interval is centered at a distribution's mean, the tighter the spread the more density falls inside it: Sedan Alpha (σ=$1k, 68.3%) > SUV Beta (σ=$5k, 15.9%) > Truck Delta (flat, 10.0%) > Coupe Gamma, whose mean sits so far outside the window that only its thin tail (2.1%) reaches it.",
  },

  // --- CLASSICAL DICE/CARD COMPARISONS ---
  {
    id: "prob-core-3",
    category: "dice-and-cards",
    type: "rank-order",
    title: "Dice Combinations Probability Ranking",
    scenarioText: "Rank the following 4 independent dice events from MOST LIKELY to LEAST LIKELY to occur.",
    difficulty: 2,
    timeLimitSec: 40,
    options: [
      {
        id: "event-a",
        label: "Rolling at least one 6 in 4 rolls of a fair 6-sided die",
        probValue: 0.5177,
        formattedProb: "51.8%",
        rationale: "1 − (5/6)⁴ = 1 − 625/1296 = 671/1296 ≈ 51.77% (the Chevalier de Méré problem).",
      },
      {
        id: "event-b",
        label: "Rolling a total sum of 7 with two fair 6-sided dice",
        probValue: 0.1667,
        formattedProb: "16.7%",
        rationale: "6 outcomes out of 36 = 1/6 ≈ 16.67%.",
      },
      {
        id: "event-c",
        label: "Rolling a total sum of 10 with three fair 6-sided dice",
        probValue: 0.125,
        formattedProb: "12.5%",
        rationale: "27 outcomes out of 216 = 27/216 = 1/8 = 12.50%.",
      },
      {
        id: "event-d",
        label: "Rolling a total sum of 9 with three fair 6-sided dice",
        probValue: 0.1157,
        formattedProb: "11.6%",
        rationale: "25 outcomes out of 216 ≈ 11.57%.",
      },
    ],
    correctRankOrder: ["event-a", "event-b", "event-c", "event-d"],
    explanation:
      "Event A (51.8%) > Event B (16.7%) > Event C, sum 10 with 3 dice (12.5%) > Event D, sum 9 with 3 dice (11.6%). Sum 10 has 27 ways out of 216 versus sum 9's 25 ways — the two are close, but 10 is strictly more likely (3d6 sums peak at 10 and 11, not 9).",
  },

  // --- BAYESIAN / URN ---
  {
    id: "prob-core-4",
    category: "bayesian-urns",
    type: "rank-order",
    title: "Diagnostic Test Positive Predictive Value",
    scenarioText:
      "A screening test has 95% sensitivity and 90% specificity. Rank these four patient populations, each with a different disease base rate, from MOST LIKELY to LEAST LIKELY to actually have the disease given a positive test result.",
    difficulty: 3,
    timeLimitSec: 45,
    options: [
      {
        id: "prior-30",
        label: "Population D: 30% base rate",
        probValue: 0.8028,
        formattedProb: "80.3%",
        rationale: "PPV = (0.95×0.30) / (0.95×0.30 + 0.10×0.70) ≈ 80.3%.",
      },
      {
        id: "prior-10",
        label: "Population C: 10% base rate",
        probValue: 0.5135,
        formattedProb: "51.3%",
        rationale: "PPV = (0.95×0.10) / (0.95×0.10 + 0.10×0.90) ≈ 51.3%.",
      },
      {
        id: "prior-05",
        label: "Population B: 5% base rate",
        probValue: 0.3333,
        formattedProb: "33.3%",
        rationale: "PPV = (0.95×0.05) / (0.95×0.05 + 0.10×0.95) ≈ 33.3%.",
      },
      {
        id: "prior-01",
        label: "Population A: 1% base rate",
        probValue: 0.0876,
        formattedProb: "8.8%",
        rationale: "PPV = (0.95×0.01) / (0.95×0.01 + 0.10×0.99) ≈ 8.8% — most positives are false positives when the disease is rare.",
      },
    ],
    correctRankOrder: ["prior-30", "prior-10", "prior-05", "prior-01"],
    explanation:
      "Bayes' theorem: P(disease | positive) = sensitivity·prior / [sensitivity·prior + (1−specificity)·(1−prior)]. The same test performs very differently across populations — a positive result means much less in a low-prevalence population, which is the classic base-rate trap.",
  },

  // --- POISSON ARRIVALS ---
  {
    id: "prob-core-5",
    category: "poisson-arrivals",
    type: "rank-order",
    title: "HFT Packet Arrival Gaps",
    scenarioText:
      "Order packets arrive at a matching engine as a Poisson process at λ = 4 packets/ms. Rank the following events from MOST LIKELY to LEAST LIKELY.",
    difficulty: 3,
    timeLimitSec: 40,
    options: [
      {
        id: "gap-01",
        label: "Zero packets arrive in a 0.1 ms window (λt = 0.4)",
        probValue: 0.6703,
        formattedProb: "67.0%",
        rationale: "P(0; λt) = e^(−0.4) ≈ 67.0%.",
      },
      {
        id: "gap-05",
        label: "Zero packets arrive in a 0.5 ms window (λt = 2.0)",
        probValue: 0.1353,
        formattedProb: "13.5%",
        rationale: "P(0; λt) = e^(−2.0) ≈ 13.5%.",
      },
      {
        id: "gap-10",
        label: "Zero packets arrive in a 1.0 ms window (λt = 4.0)",
        probValue: 0.0183,
        formattedProb: "1.8%",
        rationale: "P(0; λt) = e^(−4.0) ≈ 1.8%.",
      },
    ],
    correctRankOrder: ["gap-01", "gap-05", "gap-10"],
    explanation:
      "For a Poisson process, P(0 arrivals in time t) = e^(−λt) — it shrinks fast as the window widens. A busier feed makes long gaps rare.",
  },
];
