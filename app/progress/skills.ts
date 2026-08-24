// The unit of progress is a SKILL, not a game. A game can train several
// skills, and the same skill is trained by games in different labs — which
// is what lets a study plan say "your conditional probability is weak" and
// point at the right games regardless of which lab they live in.

export type SkillTag =
  // Probability
  | "conditional-probability"
  | "combinatorics"
  | "expected-value"
  | "distributions"
  // Statistics
  | "regression"
  | "selection-bias"
  | "hypothesis-testing"
  // Calculus / linear algebra
  | "approximation"
  | "optimization"
  | "linear-algebra"
  // Stochastic processes
  | "markov-chains"
  | "optional-stopping"
  // Algorithms
  | "complexity"
  | "dynamic-programming"
  | "data-structures"
  | "monte-carlo"
  | "coding-implementation"
  // Finance
  | "options-greeks"
  | "market-making"
  // General reasoning
  | "game-theory"
  | "logic-puzzles"
  | "estimation"
  | "mental-math"
  | "pattern-recognition";

export const SKILL_LABELS: Record<SkillTag, string> = {
  "conditional-probability": "Conditional probability",
  combinatorics: "Combinatorics",
  "expected-value": "Expected value",
  distributions: "Distributions",
  regression: "Regression",
  "selection-bias": "Selection bias",
  "hypothesis-testing": "Hypothesis testing",
  approximation: "Approximation",
  optimization: "Optimization",
  "linear-algebra": "Linear algebra",
  "markov-chains": "Markov chains",
  "optional-stopping": "Optional stopping",
  complexity: "Complexity",
  "dynamic-programming": "Dynamic programming",
  "data-structures": "Data structures",
  "monte-carlo": "Monte Carlo",
  "coding-implementation": "Coding implementation",
  "options-greeks": "Option greeks",
  "market-making": "Market making",
  "game-theory": "Game theory",
  "logic-puzzles": "Logic puzzles",
  estimation: "Estimation",
  "mental-math": "Mental math",
  "pattern-recognition": "Pattern recognition",
};

export const ALL_SKILLS = Object.keys(SKILL_LABELS) as SkillTag[];
