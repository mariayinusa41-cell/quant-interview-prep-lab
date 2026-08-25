// Where each skill is actually trained.
//
// Lives here rather than inside SkillMap because the CONTINUE? panel needs
// the same mapping to recommend a next run — two copies would eventually
// disagree about where a skill is practised.

import type { SkillTag } from "./skills";

export const SKILL_HREF: Record<SkillTag, string> = {
  "conditional-probability": "/probability",
  combinatorics: "/probability",
  "expected-value": "/probability/quitters-never-lose/casino/dice-lab",
  distributions: "/statistics/distributions",
  regression: "/statistics/crack-the-bot",
  "selection-bias": "/statistics/backtests",
  "hypothesis-testing": "/statistics",
  approximation: "/calculus-linear-algebra",
  optimization: "/calculus-linear-algebra",
  "linear-algebra": "/calculus-linear-algebra",
  "markov-chains": "/stochastic-processes/ruin-walker",
  "optional-stopping": "/stochastic-processes/martingale-mutiny",
  complexity: "/algorithms",
  "dynamic-programming": "/algorithms",
  "data-structures": "/quantdev/order-book",
  "monte-carlo": "/algorithms",
  "coding-implementation": "/quantdev",
  "options-greeks": "/finance/delta-defender",
  "market-making": "/finance/market-maker",
  "game-theory": "/brain-teasers",
  "logic-puzzles": "/brain-teasers",
  estimation: "/drills/fermi",
  "mental-math": "/drills/arithmetic",
  "pattern-recognition": "/drills/sequences",
};

/** Human name of the lab a skill is trained in, for recommendation copy. */
export const SKILL_LAB_NAME: Record<SkillTag, string> = {
  "conditional-probability": "Quitters Never Lose",
  combinatorics: "Quitters Never Lose",
  "expected-value": "Dice EV Lab",
  distributions: "Read the Shape",
  regression: "Crack the Bot",
  "selection-bias": "Twenty Backtests",
  "hypothesis-testing": "Statistics Lab",
  approximation: "Gradient Lab",
  optimization: "Gradient Lab",
  "linear-algebra": "Gradient Lab",
  "markov-chains": "Ruin Walker",
  "optional-stopping": "Martingale Mutiny",
  complexity: "Algorithm Arena",
  "dynamic-programming": "Algorithm Arena",
  "data-structures": "Order Book Engine",
  "monte-carlo": "Algorithm Arena",
  "coding-implementation": "Quant Dev Lab",
  "options-greeks": "Delta Defender",
  "market-making": "Market Maker",
  "game-theory": "Brain Teasers",
  "logic-puzzles": "Brain Teasers",
  estimation: "Fermi Estimation",
  "mental-math": "Arithmetic Drill",
  "pattern-recognition": "Sequence Sprint",
};
