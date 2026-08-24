import { choiceItem, rnd, type Assessment, type Item } from "../engine/types";

function actuarialSet(n: number): Item[] {
  const builders = [
    (i: number) => {
      const q = rnd.pick([0.012, 0.018, 0.025, 0.04]);
      return {
        id: `a-${i}`, kind: "numeric" as const,
        prompt: `A life aged x has qₓ = ${q}. What is pₓ?`,
        answer: Math.round((1 - q) * 10000) / 10000, tolerance: 0.0005,
        skill: "distributions" as const,
        explain: `pₓ = 1 − qₓ = ${Math.round((1 - q) * 10000) / 10000}.`,
      };
    },
    (i: number) => {
      const qs = [rnd.pick([0.01, 0.012]), rnd.pick([0.013, 0.015]), rnd.pick([0.016, 0.018])];
      const p = qs.reduce((a, x) => a * (1 - x), 1);
      return {
        id: `a-${i}`, kind: "numeric" as const,
        block: `q(x)   = ${qs[0]}\nq(x+1) = ${qs[1]}\nq(x+2) = ${qs[2]}`,
        prompt: "What is ₃pₓ, the probability of surviving three years? (4 decimal places)",
        answer: Math.round(p * 10000) / 10000, tolerance: 0.0006,
        skill: "distributions" as const,
        explain: `Survival compounds multiplicatively: ${(1 - qs[0]).toFixed(3)} × ${(1 - qs[1]).toFixed(3)} × ${(1 - qs[2]).toFixed(3)} = ${p.toFixed(4)}.`,
      };
    },
    (i: number) => choiceItem(
      `a-${i}`,
      "For an annuity-due, what is the k = 0 term of the EPV sum?",
      "Exactly the payment — no discount and no mortality",
      ["The payment discounted one year", "The payment times p(x)", "Zero, since payments start at k = 1"],
      "expected-value",
      "An annuity-due pays immediately: v⁰ = 1 and ₀pₓ = 1, so the first payment is certain and undiscounted.",
    ),
    (i: number) => choiceItem(
      `a-${i}`,
      "Mortality improves across the whole table. What happens to a life annuity's EPV?",
      "It rises — more payments are expected",
      ["It falls, since fewer deaths means fewer claims", "It is unchanged if the discount rate is unchanged", "It rises only for deferred annuities"],
      "expected-value",
      "An annuity writer is short longevity. Every improvement in mortality lengthens the payment stream and raises the liability.",
    ),
    (i: number) => {
      const c = [[1000, 1500], [1100, 1650], [1200, 1800]];
      const num = c.reduce((a, r) => a + r[1], 0), den = c.reduce((a, r) => a + r[0], 0);
      const ldf = Math.round((num / den) * 10000) / 10000;
      return {
        id: `a-${i}`, kind: "numeric" as const,
        block: `Origin   Dev 0    Dev 1\n2022     ${c[0][0]}     ${c[0][1]}\n2023     ${c[1][0]}     ${c[1][1]}\n2024     ${c[2][0]}     ${c[2][1]}`,
        prompt: "What is the volume-weighted link ratio from development 0 to 1?",
        answer: ldf, tolerance: 0.002,
        skill: "distributions" as const,
        explain: `Σ dev-1 ÷ Σ dev-0 = ${num} ÷ ${den} = ${ldf}. Volume weighting lets a large mature year count for more than a small one.`,
      };
    },
    (i: number) => choiceItem(
      `a-${i}`,
      "The newest origin year has one very small paid figure and a large CDF. Why prefer Bornhuetter-Ferguson to chain ladder?",
      "Chain ladder multiplies that single noisy figure by the CDF, so noise dominates the estimate",
      ["BF always produces a smaller reserve", "Chain ladder cannot handle immature years at all", "BF ignores the claims data entirely"],
      "selection-bias",
      "BF is a credibility blend, Z × chain ladder + (1 − Z) × a-priori with Z = %developed. It leans on an independent expectation exactly when the actual data is too thin to trust.",
    ),
    (i: number) => choiceItem(
      `a-${i}`,
      "In the Cramér-Lundberg surplus model, what drives the ruin probability down?",
      "A larger premium loading relative to expected claim severity",
      ["A higher claim arrival rate", "A heavier-tailed severity distribution", "A lower initial surplus"],
      "optional-stopping",
      "Ruin probability falls with initial surplus and with the safety loading, and rises with claim frequency and tail heaviness.",
    ),
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

export const ACTUARIAL_ASSESSMENT: Assessment = {
  id: "asmt-actuarial",
  firm: "SOA / CAS-style",
  title: "Actuarial Analyst Screen",
  track: "actuary",
  blurb:
    "Modelled on entry-level actuarial screening: life contingencies, compounding survival, annuity valuation, loss development and ruin theory.",
  rules: [
    "20 items, 30 minutes.",
    "No negative marking.",
    "Give probabilities to four decimal places.",
  ],
  sections: [
    {
      id: "life",
      name: "Life contingencies & reserving",
      brief: "20 items, 30 minutes.",
      seconds: 30 * 60, penalty: 0, allowBack: false,
      itemCount: 20,
      generate: () => actuarialSet(20),
    },
  ],
};
