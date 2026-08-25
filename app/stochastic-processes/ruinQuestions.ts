// Procedural question bank for Ruin Walker.
//
// The game previously asked exactly one question, ψ(u), every single period —
// only the numbers moved, so after two periods you were pattern-matching a
// single formula rather than reasoning about the model. This draws from
// eight distinct quantities in the same Cramér–Lundberg setup, each an exact
// closed form off the CURRENT surplus and loading, so the pool is effectively
// infinite without any of the answers being approximations.
//
// Every formula here is the same one the engine itself uses (imported, not
// re-typed), so a question can never disagree with the simulation it is
// asked about.

import {
  LAMBDA,
  MU,
  adjustmentCoefficient,
  lundbergBound,
  premiumRate,
  ruinProbability,
} from "./cramerLundbergMath";

export type RuinQuestionKind =
  | "psi-u"
  | "psi-zero"
  | "adjustment-R"
  | "premium-c"
  | "lundberg"
  | "required-surplus"
  | "expected-claims"
  | "net-drift";

export type RuinQuestion = {
  kind: RuinQuestionKind;
  /** Short label shown above the prompt. */
  topic: string;
  /** The question, as plain prose. The formula renders separately as math. */
  prompt: string;
  /** Which formula to display alongside the prompt. */
  formula: RuinQuestionKind;
  /** Substituted values, e.g. { u: 20, theta: 0.25 }. */
  given: Array<{ label: string; value: string }>;
  answer: number;
  /** Absolute tolerance for grading. */
  tolerance: number;
  /** Rendered after checking. */
  explanation: string;
  /** true when the answer is a probability the UI should show as a percent. */
  isProbability: boolean;
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const f2 = (v: number) => v.toFixed(2);
const f4 = (v: number) => v.toFixed(4);

/**
 * Builds one question about the live state of the book.
 *
 * `surplus` and `theta` are the real current values, so answering correctly
 * requires reading the HUD rather than recalling the previous period.
 */
export function makeRuinQuestion(
  surplus: number,
  theta: number,
  rng: () => number = Math.random,
): RuinQuestion {
  const R = adjustmentCoefficient(theta, MU);
  const u = Math.max(surplus, 0);
  const thetaPct = `${Math.round(theta * 100)}%`;

  const pool: RuinQuestionKind[] = [
    "psi-u",
    "psi-zero",
    "adjustment-R",
    "premium-c",
    "lundberg",
    "required-surplus",
    "expected-claims",
    "net-drift",
  ];
  const kind = pool[Math.floor(rng() * pool.length)];

  switch (kind) {
    case "psi-u": {
      const answer = ruinProbability(u, theta, MU);
      return {
        kind, formula: kind, topic: "Ruin probability",
        prompt: "What is the probability this book is eventually ruined from where it stands now?",
        given: [
          { label: "u", value: f2(u) },
          { label: "θ", value: thetaPct },
          { label: "R", value: f4(R) },
        ],
        answer, tolerance: 0.02, isProbability: true,
        explanation: `ψ(${f2(u)}) = (1/(1+${theta})) · e^(−${f4(R)}·${f2(u)}) = ${pct(answer)}. Surplus enters only through the exponential, so every extra tick of surplus multiplies the ruin probability by e^(−R).`,
      };
    }
    case "psi-zero": {
      const answer = 1 / (1 + theta);
      return {
        kind, formula: kind, topic: "Ruin from nothing",
        prompt: "If this book were rebuilt from zero surplus at the same loading, what would its ruin probability be?",
        given: [{ label: "θ", value: thetaPct }],
        answer, tolerance: 0.02, isProbability: true,
        explanation: `ψ(0) = 1/(1+θ) = 1/${(1 + theta).toFixed(2)} = ${pct(answer)}. Note it is NOT 100%: with positive loading the premium stream alone can outrun the claims, even starting with nothing banked.`,
      };
    }
    case "adjustment-R": {
      return {
        kind, formula: kind, topic: "Adjustment coefficient",
        prompt: "What is the adjustment coefficient R at this loading?",
        given: [
          { label: "θ", value: thetaPct },
          { label: "μ", value: String(MU) },
        ],
        answer: R, tolerance: 0.005, isProbability: false,
        explanation: `R = θ/((1+θ)μ) = ${theta}/(${(1 + theta).toFixed(2)}·${MU}) = ${f4(R)}. R is the decay rate of ruin risk per unit of surplus - bigger R means surplus buys safety faster.`,
      };
    }
    case "premium-c": {
      const answer = premiumRate(theta, LAMBDA, MU);
      return {
        kind, formula: kind, topic: "Premium rate",
        prompt: "What premium does this book collect per period?",
        given: [
          { label: "θ", value: thetaPct },
          { label: "λ", value: String(LAMBDA) },
          { label: "μ", value: String(MU) },
        ],
        answer, tolerance: 0.05, isProbability: false,
        explanation: `c = (1+θ)λμ = ${(1 + theta).toFixed(2)}·${LAMBDA}·${MU} = ${f2(answer)} ticks per period. Expected claims are λμ = ${(LAMBDA * MU).toFixed(2)}, so the loading is the margin on top.`,
      };
    }
    case "lundberg": {
      const answer = lundbergBound(u, theta, MU);
      return {
        kind, formula: kind, topic: "Lundberg bound",
        prompt: "What is Lundberg's upper bound on ruin probability at this surplus?",
        given: [
          { label: "u", value: f2(u) },
          { label: "R", value: f4(R) },
        ],
        answer, tolerance: 0.02, isProbability: true,
        explanation: `e^(−Ru) = e^(−${f4(R)}·${f2(u)}) = ${pct(answer)}. This bound holds for ANY claim-size distribution. Here claims are exponential, so the exact answer is smaller by the factor 1/(1+θ).`,
      };
    }
    case "required-surplus": {
      // Solve ψ(u) = target for u.
      const targets = [0.01, 0.02, 0.05, 0.1];
      const target = targets[Math.floor(rng() * targets.length)];
      const base = 1 / (1 + theta);
      // If the target is already met at u = 0, the answer is 0.
      const answer = target >= base ? 0 : Math.log(base / target) / R;
      return {
        kind, formula: kind, topic: "Surplus needed",
        prompt: `How much surplus u is needed to push the ruin probability down to ${pct(target)}?`,
        given: [
          { label: "target ψ", value: pct(target) },
          { label: "θ", value: thetaPct },
          { label: "R", value: f4(R) },
        ],
        answer, tolerance: Math.max(1, answer * 0.05), isProbability: false,
        explanation: `Set (1/(1+θ))·e^(−Ru) = ${target} and solve: u = ln[(1/(1+θ)) / ${target}] / R = ${f2(answer)} ticks. This is the inverse of the ruin formula - the surplus you must hold to buy a given safety level.`,
      };
    }
    case "expected-claims": {
      const answer = LAMBDA * MU;
      return {
        kind, formula: kind, topic: "Expected claims",
        prompt: "What is the expected total claim amount per period?",
        given: [
          { label: "λ", value: String(LAMBDA) },
          { label: "μ", value: String(MU) },
        ],
        answer, tolerance: 0.05, isProbability: false,
        explanation: `E[S] = λμ = ${LAMBDA}·${MU} = ${f2(answer)} ticks per period. Claim COUNT is Poisson(λ) and each claim averages μ, so by Wald's identity the expected total is just the product.`,
      };
    }
    case "net-drift":
    default: {
      const answer = premiumRate(theta, LAMBDA, MU) - LAMBDA * MU;
      return {
        kind: "net-drift", formula: "net-drift", topic: "Net drift",
        prompt: "On average, how much does the surplus gain per period?",
        given: [
          { label: "θ", value: thetaPct },
          { label: "λμ", value: f2(LAMBDA * MU) },
        ],
        answer, tolerance: 0.05, isProbability: false,
        explanation: `Drift = c − λμ = θλμ = ${theta}·${(LAMBDA * MU).toFixed(2)} = ${f2(answer)} ticks per period. This is the net profit condition: the book only survives long-run because this is positive.`,
      };
    }
  }
}
