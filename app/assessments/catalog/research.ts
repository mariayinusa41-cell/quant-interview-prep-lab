import { choiceItem, rnd, type Assessment, type Item } from "../engine/types";

/** Probability and distribution items at research depth. */
function probSet(n: number): Item[] {
  const builders = [
    (i: number) => {
      const lam = rnd.pick([2, 3, 4, 5]);
      const t = rnd.pick([2, 3]);
      return choiceItem(
        `p-${i}`,
        `Trades arrive as a Poisson process with rate λ = ${lam} per minute. What is the expected number of arrivals in ${t} minutes, and the variance?`,
        `Mean ${lam * t}, variance ${lam * t}`,
        [`Mean ${lam * t}, variance ${lam}`, `Mean ${lam}, variance ${lam * t}`, `Mean ${lam * t}, variance ${Math.round(Math.sqrt(lam * t) * 100) / 100}`],
        "distributions",
        `For a Poisson process the count over time t is Poisson(λt), whose mean and variance are both λt = ${lam * t}.`,
      );
    },
    (i: number) => {
      const n2 = rnd.pick([3, 4, 5]);
      return choiceItem(
        `p-${i}`,
        `You draw ${n2} values independently and uniformly from [0, 1]. What is the expected value of the maximum?`,
        `${n2}/${n2 + 1}`,
        [`1/${n2}`, `1/2`, `${n2 - 1}/${n2}`],
        "distributions",
        `For the maximum of n iid Uniform(0,1) draws, E[max] = n/(n+1) = ${n2}/${n2 + 1}.`,
      );
    },
    (i: number) => {
      const p = rnd.pick([0.2, 0.25, 0.4, 0.5]);
      return choiceItem(
        `p-${i}`,
        `A biased coin lands heads with probability ${p}. What is the expected number of flips until the first head?`,
        String(Math.round((1 / p) * 100) / 100),
        [String(p), String(Math.round((1 / (1 - p)) * 100) / 100), String(Math.round((1 - p) / p * 100) / 100)],
        "expected-value",
        `A geometric waiting time has mean 1/p = ${Math.round((1 / p) * 100) / 100}.`,
      );
    },
    (i: number) => {
      const sd = rnd.pick([2, 3, 4, 5]);
      return choiceItem(
        `p-${i}`,
        `X and Y are independent with variance ${sd * sd} each. What is Var(X − Y)?`,
        String(2 * sd * sd),
        ["0", String(sd * sd), String(Math.round(Math.sqrt(2) * sd * sd))],
        "distributions",
        `Variances add under independence regardless of sign: Var(X−Y) = Var(X) + Var(Y) = ${2 * sd * sd}.`,
      );
    },
    (i: number) => choiceItem(
      `p-${i}`,
      "A stationary Markov chain has transition matrix P. Which statement about its stationary distribution π is correct?",
      "π satisfies πP = π and sums to 1",
      ["π is the first row of P", "π is the largest eigenvector of Pᵀ scaled arbitrarily", "π equals the diagonal of P"],
      "markov-chains",
      "The stationary distribution is the left eigenvector of P with eigenvalue 1, normalised to sum to 1.",
    ),
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

/** Inference, and the traps that kill live strategies. */
function inferenceSet(n: number): Item[] {
  const builders = [
    (i: number) => {
      const k = rnd.pick([20, 40, 100]);
      return choiceItem(
        `s-${i}`,
        `You backtest ${k} independent strategies, all genuinely worthless, at the 5% level. How many do you expect to look significant?`,
        String(k * 0.05),
        ["0", String(k * 0.5), "1 regardless of k"],
        "selection-bias",
        `Each has a 5% false-positive rate, so the expectation is ${k} × 0.05 = ${k * 0.05}. This is why multiple-comparison correction exists.`,
      );
    },
    (i: number) => choiceItem(
      `s-${i}`,
      "A backtest uses the closing price to decide a trade placed at that same close. Which flaw is this?",
      "Look-ahead bias",
      ["Survivorship bias", "Heteroskedasticity", "Multicollinearity"],
      "selection-bias",
      "The rule consumes information not available at decision time. Live, you could not have known the close before trading it.",
    ),
    (i: number) => choiceItem(
      `s-${i}`,
      "A universe is built from firms currently in the index. What does this omit?",
      "Firms that were delisted or went bankrupt",
      ["Firms that outperformed", "Firms with high volatility", "Nothing - the index is complete"],
      "selection-bias",
      "Survivorship bias: the losers left the index and dropped out of the sample, inflating measured returns.",
    ),
    (i: number) => {
      const n2 = rnd.pick([100, 400, 900]);
      return choiceItem(
        `s-${i}`,
        `A Monte Carlo estimate uses ${n2} paths. Roughly how many are needed to halve the standard error?`,
        String(n2 * 4),
        [String(n2 * 2), String(n2 * 16), String(n2 / 2)],
        "monte-carlo",
        `Standard error scales as 1/√n, so cutting it in half needs four times the paths: ${n2 * 4}.`,
      );
    },
    (i: number) => choiceItem(
      `s-${i}`,
      "A regression of returns on a signal gives t = 6.2 but R² = 0.004. What is the correct reading?",
      "The relationship is reliably non-zero but explains almost none of the variation",
      ["The model is misspecified and t is invalid", "R² of 0.004 means the t-statistic must be wrong", "The signal explains 40% of returns"],
      "regression",
      "Statistical significance and explanatory power are different questions. With enough observations a tiny effect is measurable - and in trading a tiny reliable edge can still be valuable.",
    ),
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

export const RESEARCH_ASSESSMENT: Assessment = {
  id: "asmt-citadel-research",
  firm: "Citadel / Two Sigma-style",
  title: "Quant Research Screen",
  track: "quant-research",
  blurb:
    "Modelled on the long-form research online assessments: distribution theory, stochastic processes, and the inference traps that kill a live strategy.",
  rules: [
    "Two sections, 40 minutes total.",
    "No negative marking - answer everything.",
    "Long-form pace: these reward care, not speed.",
  ],
  sections: [
    {
      id: "prob",
      name: "Probability & stochastic processes",
      brief: "14 items, 22 minutes. Poisson processes, order statistics, Markov chains.",
      seconds: 22 * 60, penalty: 0, allowBack: false,
      itemCount: 14,
      generate: () => probSet(14),
    },
    {
      id: "infer",
      name: "Inference & research integrity",
      brief: "12 items, 18 minutes. Multiple comparisons, look-ahead, survivorship.",
      seconds: 18 * 60, penalty: 0, allowBack: false,
      itemCount: 12,
      generate: () => inferenceSet(12),
    },
  ],
};
