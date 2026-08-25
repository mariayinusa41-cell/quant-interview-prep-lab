import { choiceItem, rnd, type Assessment, type Item } from "../engine/types";

/** Causal identification — the core of an econ consulting analyst screen. */
function causalSet(n: number): Item[] {
  const builders = [
    (i: number) => {
      const tPre = rnd.int(480, 540), tPost = tPre - rnd.int(90, 140);
      const cPre = rnd.int(470, 520), cPost = cPre - rnd.int(20, 60);
      const did = (tPost - tPre) - (cPost - cPre);
      return {
        id: `d-${i}`, kind: "numeric" as const,
        block: `                Before    After\nTreated  (A)     ${tPre}      ${tPost}\nControl  (B)     ${cPre}      ${cPost}`,
        prompt: "What is the difference-in-differences estimate?",
        answer: did, tolerance: 1,
        skill: "regression" as const,
        explain: `(${tPost} − ${tPre}) − (${cPost} − ${cPre}) = ${tPost - tPre} − (${cPost - cPre}) = ${did}.`,
      };
    },
    (i: number) => choiceItem(
      `d-${i}`,
      "Which fact would invalidate a difference-in-differences estimate?",
      "A shock that hit only the treated group during the post period",
      ["The treated group always had higher sales than the control", "A cost shock that hit both groups equally", "The two groups are in different regions"],
      "selection-bias",
      "A fixed level gap cancels in the first difference, and a common shock cancels in the second. Only a treated-group-only shock inside the post window survives both subtractions and contaminates the estimate.",
    ),
    (i: number) => choiceItem(
      `d-${i}`,
      "What must an instrumental variable satisfy?",
      "Correlated with the endogenous regressor, and uncorrelated with the error term",
      ["Correlated with the outcome and the regressor", "Uncorrelated with the regressor and correlated with the error", "Normally distributed with mean zero"],
      "regression",
      "Relevance plus the exclusion restriction. The instrument may affect the outcome only through the endogenous variable.",
    ),
    (i: number) => choiceItem(
      `d-${i}`,
      "A regression of wages on education omits ability, which raises both. What happens to the education coefficient?",
      "It is biased upward - it absorbs part of ability's effect",
      ["It is biased downward", "It is unbiased but inefficient", "Only the intercept is affected"],
      "regression",
      "Omitted variable bias takes the sign of (effect of omitted on outcome) × (correlation with the included regressor). Both are positive here, so the estimate is inflated.",
    ),
    (i: number) => choiceItem(
      `d-${i}`,
      "Before running a DiD, which check most supports the identifying assumption?",
      "Confirming the two groups moved in parallel before treatment",
      ["Confirming the groups had equal levels before treatment", "Confirming both groups are the same size", "Confirming the outcome is normally distributed"],
      "regression",
      "The assumption is parallel trends, not equal levels. Pre-period slopes are the evidence; identical starting values are neither required nor sufficient.",
    ),
    (i: number) => {
      const s1 = rnd.pick([20, 25, 30]), s2 = rnd.pick([12, 15, 18]);
      const d = 2 * s1 * s2;
      return {
        id: `d-${i}`, kind: "numeric" as const,
        prompt: `Two firms with market shares ${s1}% and ${s2}% merge. By how many points does the HHI rise?`,
        answer: d, tolerance: 1,
        skill: "combinatorics" as const,
        explain: `ΔHHI = 2·s₁·s₂ = 2 × ${s1} × ${s2} = ${d}. Every other firm's squared share is unchanged, so the whole delta is that one cross term.`,
      };
    },
    (i: number) => choiceItem(
      `d-${i}`,
      "A merging party proposes a much broader market definition. What is the effect on the screen?",
      "Shares are diluted, so ΔHHI falls and the deal looks less concentrating",
      ["ΔHHI rises because more firms are counted", "HHI is unaffected by market definition", "It only changes the post-merger HHI, not the delta"],
      "game-theory",
      "The denominator grows, every share shrinks, and ΔHHI = 2·s₁·s₂ falls quadratically. This is why market definition, not arithmetic, decides these cases.",
    ),
    (i: number) => choiceItem(
      `d-${i}`,
      "In the hypothetical monopolist (SSNIP) test, what does a candidate market failing the test imply?",
      "The market is drawn too narrowly and must be widened",
      ["The merger should be blocked", "The market is drawn too broadly", "Cross-price elasticities are irrelevant"],
      "game-theory",
      "If a hypothetical monopolist could not profitably raise price 5-10%, too many customers escape to substitutes outside the candidate market - so those substitutes belong inside it.",
    ),
  ];
  return Array.from({ length: n }, (_, i) => rnd.pick(builders)(i));
}

export const ECON_ASSESSMENT: Assessment = {
  id: "asmt-econ-consulting",
  firm: "Cornerstone / Analysis Group-style",
  title: "Economic Consulting Analyst Screen",
  track: "econ-consulting",
  blurb:
    "There is no standard screen for this field yet - this is built from what analyst work actually requires: causal identification, regression diagnostics, and competition analysis defensible under cross-examination.",
  rules: [
    "22 items, 35 minutes.",
    "No negative marking.",
    "Several items have a defensible-looking wrong answer. The distractors are the test.",
  ],
  sections: [
    {
      id: "causal",
      name: "Causal inference & competition",
      brief: "22 items, 35 minutes. DiD, IV, omitted variables, HHI and market definition.",
      seconds: 35 * 60, penalty: 0, allowBack: false,
      itemCount: 22,
      generate: () => causalSet(22),
    },
  ],
};
