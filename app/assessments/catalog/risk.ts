import { choiceItem, rnd, type Assessment, type Item } from "../engine/types";

const Z99 = 2.3263, Z95 = 1.6449, ES99 = 2.6652, ES975 = 2.3378;

function riskSet(n: number): Item[] {
  const builders = [
    (i: number) => {
      const vol = rnd.pick([1.0, 1.2, 1.5, 2.0]);
      const nav = rnd.pick([50, 100, 200]);
      const v = Math.round(Z99 * (vol / 100) * nav * 100) / 100;
      return choiceItem(
        `r-${i}`,
        `A $${nav}M book has daily volatility ${vol}%. What is the 99% one-day parametric VaR, assuming zero mean?`,
        `$${v}M`,
        [`$${Math.round(Z95 * (vol / 100) * nav * 100) / 100}M`, `$${Math.round((vol / 100) * nav * 100) / 100}M`, `$${Math.round(ES99 * (vol / 100) * nav * 100) / 100}M`],
        "distributions",
        `VaR = z₀.₉₉ × σ × NAV = 2.3263 × ${vol}% × $${nav}M = $${v}M.`,
      );
    },
    (i: number) => {
      const vol = rnd.pick([1.0, 1.2, 1.5]);
      const nav = rnd.pick([100, 200]);
      const es = Math.round(ES99 * (vol / 100) * nav * 100) / 100;
      return choiceItem(
        `r-${i}`,
        `Same $${nav}M book at ${vol}% daily vol. What is the 99% Expected Shortfall?`,
        `$${es}M`,
        [`$${Math.round(Z99 * (vol / 100) * nav * 100) / 100}M`, `$${Math.round((vol / 100) * nav * 100) / 100}M`, `$${Math.round(ES975 * (vol / 100) * nav * 100) / 100}M`],
        "expected-value",
        `ES = σ·φ(z)/(1−α) = ${ES99} × ${vol}% × $${nav}M = $${es}M - always above VaR, because it averages the tail rather than marking its edge.`,
      );
    },
    (i: number) => choiceItem(
      `r-${i}`,
      "Why did Basel move from VaR to Expected Shortfall?",
      "ES is subadditive and describes the loss beyond the threshold; VaR is neither",
      ["ES is easier to compute", "VaR requires normality and ES does not", "ES always produces a smaller capital charge"],
      "distributions",
      "VaR can fail subadditivity, so splitting a book across desks can make total risk look smaller. ES cannot be gamed that way, and it says how bad the tail is rather than only where it starts.",
    ),
    (i: number) => {
      const w = [0.5, 0.3, 0.2], s = [1.2, 0.8, 2.5];
      const weighted = Math.round(w.reduce((a, x, k) => a + x * s[k], 0) * 1000) / 1000;
      return choiceItem(
        `r-${i}`,
        "In a crisis every pairwise correlation converges to 1. What does portfolio volatility become?",
        "The weighted sum of the individual volatilities",
        ["The square root of the sum of squared weights", "Unchanged - correlation affects only covariance", "The largest single asset volatility"],
        "distributions",
        `At ρ = 1 the cross terms are maximal and σₚ collapses to Σwᵢσᵢ (here ${weighted}%). Diversification stops existing exactly when it is needed.`,
      );
    },
    (i: number) => choiceItem(
      `r-${i}`,
      "Returns are leptokurtic but you price risk with a normal model. What is the consequence?",
      "Tail losses are systematically understated",
      ["Tail losses are overstated", "Only the mean is biased", "Nothing, if volatility is estimated correctly"],
      "distributions",
      "Fat tails put more mass far from the mean than a Gaussian allows. At identical variance a Student-t(4) has materially higher VaR and ES.",
    ),
    (i: number) => choiceItem(
      `r-${i}`,
      "A portfolio is short gamma. Volatility spikes sharply. What happens?",
      "Losses accelerate as the move grows - the hedge worsens with size",
      ["Losses are linear in the move", "The position gains from higher volatility", "Delta stays constant"],
      "options-greeks",
      "Short gamma means delta moves against you as spot moves, so re-hedging locks in losses at an accelerating rate.",
    ),
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

export const RISK_ASSESSMENT: Assessment = {
  id: "asmt-risk-analyst",
  firm: "Bank / clearinghouse-style",
  title: "Risk Analyst Screen",
  track: "risk",
  blurb:
    "Modelled on sell-side and clearing risk screens: VaR and Expected Shortfall, correlation breakdown, fat tails, and the Greeks under stress.",
  rules: [
    "18 items, 25 minutes.",
    "No negative marking.",
    "Standard normal values are given where needed: z₀.₉₉ = 2.3263, ES multiplier 2.6652.",
  ],
  sections: [
    {
      id: "tail",
      name: "Tail risk & portfolio stress",
      brief: "18 items, 25 minutes.",
      seconds: 25 * 60, penalty: 0, allowBack: false,
      itemCount: 18,
      generate: () => riskSet(18),
    },
  ],
};
