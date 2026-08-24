// Procedural generators for the Probability Ranking pool. Same template
// pattern as the other drills: a handful of generators crossed against
// parameter tables so the pool runs into the hundreds without hand-writing
// every scenario — but every probability here is computed from a verified
// formula at generation time, and `rankOrderFromOptions` always derives the
// answer key by sorting on the actual computed value. An earlier draft of
// this generator assumed one of its input arrays was already sorted by
// probability and it wasn't for every branch it fed, which silently
// produced a wrong answer key — sorting at the end removes that failure
// mode entirely, here and for every generator below.

import {
  rankOrderFromOptions,
  type OptionItem,
  type ProbabilityRankingQuestion,
} from "./probabilityRankingQuestions";

let counter = 0;
const nextId = (tag: string) => `gen-${tag}-${counter++}`;

// ---- shared math helpers, verified against Node before use ----
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
function normalCdf(x: number, mean: number, sd: number): number {
  return 0.5 * (1 + erf((x - mean) / (sd * Math.sqrt(2))));
}
function intervalProb(lo: number, hi: number, mean: number, sd: number): number {
  return normalCdf(hi, mean, sd) - normalCdf(lo, mean, sd);
}
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return r;
}
function hypergeom(N: number, K: number, n: number, k: number): number {
  return (comb(K, k) * comb(N - K, n - k)) / comb(N, n);
}
function poissonPmf(k: number, lambdaT: number): number {
  return (Math.exp(-lambdaT) * Math.pow(lambdaT, k)) / factorial(k);
}
function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
function pct(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`;
}
function pick<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}
function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

// ===========================================================================
// A. Student / candidate trend extrapolation
// ===========================================================================
const SUBJECTS = [
  "Mathematics", "Quantitative Finance", "Options Pricing", "Algorithm Speed Drills",
  "Linear Algebra", "Statistics", "Market Microstructure", "Mental Math",
  "Probability Theory", "C++ Fundamentals",
];
const NAME_TRIPLES: [string, string, string][] = [
  ["Student A", "Student B", "Student C"],
  ["Candidate Alpha", "Candidate Beta", "Candidate Gamma"],
  ["Trader 1", "Trader 2", "Trader 3"],
  ["Intern X", "Intern Y", "Intern Z"],
];

function genStudentQuestions(): ProbabilityRankingQuestion[] {
  const out: ProbabilityRankingQuestion[] = [];
  for (const subject of SUBJECTS) {
    for (let variant = 0; variant < 5; variant++) {
      const [nA, nB, nC] = pick(NAME_TRIPLES);
      const aBase = randInt(72, 90);
      const aNoise = 1 + Math.random(); // 1.0-2.0, always tight
      const bStart = randInt(50, 65);
      const bStep = randInt(5, 9);
      const cLow = randInt(45, 55);
      const cHigh = randInt(90, 99);

      const aScores = [aBase - 1, aBase + 1, aBase, aBase + 2, aBase - 1];
      const bScores = [0, 1, 2, 3, 4].map((i) => bStart + i * bStep);
      const cScores = [cLow, cHigh, cLow + 2, cHigh - 1, cLow + 1];
      const projB6 = bStart + 5 * bStep;

      // The "impossible breakout" claim is the one number here actually
      // computed from a Z-score rather than chosen narratively — with
      // aNoise capped under 2, a +10 jump is always >=5σ, so this option
      // reliably lands far below the other two regardless of how the
      // narrative numbers above shake out. rankOrderFromOptions below still
      // re-derives the order from the real numbers either way.
      const breakoutTarget = aBase + 10;
      const breakoutProb = Math.max(1e-6, 1 - normalCdf(breakoutTarget, aBase, aNoise));

      const trendProb = projB6 > aBase + 5 ? 0.97 : 0.85;

      const options: OptionItem[] = [
        {
          id: "trend",
          label: `${nB} scores higher than ${nA} on Test 6`,
          probValue: trendProb,
          formattedProb: `~${Math.round(trendProb * 100)}%`,
          rationale: `${nB}'s trend of +${bStep}/test projects Test 6 ≈ ${projB6}, comfortably above ${nA}'s stable baseline of ~${aBase}.`,
        },
        {
          id: "volatile-high",
          label: `${nC} scores ${cHigh - 3} or higher on Test 6`,
          probValue: 0.4,
          formattedProb: "~40%",
          rationale: `${nC} alternates between a low and high band, hitting the high band on roughly 2 of 5 past tests (~40%).`,
        },
        {
          id: "breakout",
          label: `${nA} scores ${breakoutTarget} or higher on Test 6`,
          probValue: breakoutProb,
          formattedProb: breakoutProb < 0.001 ? "<0.1%" : pct(breakoutProb, 2),
          rationale: `${nA}'s tests cluster tightly (σ ≈ ${aNoise.toFixed(1)}). Reaching ${breakoutTarget} needs Z ≈ +${((breakoutTarget - aBase) / aNoise).toFixed(1)}σ.`,
        },
      ];

      out.push({
        id: nextId("student"),
        category: "student-performance",
        type: "rank-order",
        title: `${subject} Score Projections`,
        scenarioText: `${nA}, ${nB}, and ${nC} have each completed 5 rounds of ${subject}. Rank the following predictions for round 6 from MOST LIKELY to LEAST LIKELY.`,
        difficulty: 2,
        timeLimitSec: 45,
        tableData: {
          columns: ["Candidate", "Test 1", "Test 2", "Test 3", "Test 4", "Test 5"],
          rows: [
            { name: `${nA} (Consistent)`, values: aScores },
            { name: `${nB} (Trending)`, values: bScores },
            { name: `${nC} (Volatile)`, values: cScores },
          ],
        },
        options,
        correctRankOrder: rankOrderFromOptions(options),
        explanation: `1. ${nB}'s momentum puts round 6 well above ${nA}'s stable average.\n2. ${nC} reaches the high band roughly 40% of the time historically.\n3. ${nA} is tightly clustered — a +10 jump is a several-sigma outlier and the least likely of the three by a wide margin.`,
      });
    }
  }
  return out;
}

// ===========================================================================
// B. Price / asset distribution density in a target band
// ===========================================================================
const ASSET_SETS = [
  { unit: "$", names: ["Sedan Alpha", "SUV Beta", "Truck Delta", "Coupe Gamma"], noun: "vehicle" },
  { unit: "$", names: ["Model 1", "Model 2", "Model 3", "Model 4"], noun: "listing" },
  { unit: "$", names: ["Stock P", "Stock Q", "Stock R", "Stock S"], noun: "closing price" },
  { unit: "$", names: ["Property North", "Property South", "Property East", "Property West"], noun: "home" },
];
const PRICE_TARGETS = [
  { mid: 40000, width: 2000 },
  { mid: 50000, width: 2500 },
  { mid: 60000, width: 3000 },
  { mid: 80000, width: 4000 },
  { mid: 25000, width: 1500 },
  { mid: 120000, width: 6000 },
];

function genDistributionQuestions(): ProbabilityRankingQuestion[] {
  const out: ProbabilityRankingQuestion[] = [];
  for (const pt of PRICE_TARGETS) {
    for (let variant = 0; variant < 7; variant++) {
      const set = pick(ASSET_SETS);
      const lo = pt.mid - pt.width / 2;
      const hi = pt.mid + pt.width / 2;
      const stdTight = pt.width / 2; // exactly ±1σ -> 68.3%
      const stdWide = pt.width * 2; // ±0.25σ -> 19.7%
      const unifRange = pt.width * 8; // width/range -> 12.5%
      const shiftAway = pt.width * randInt(3, 5);

      const models: { name: string; type: "Normal" | "Uniform"; mean: number; sd: number; desc: string }[] = [
        { name: set.names[0], type: "Normal", mean: pt.mid, sd: stdTight, desc: `Normal(μ=$${pt.mid.toLocaleString()}, σ=$${stdTight.toLocaleString()})` },
        { name: set.names[1], type: "Normal", mean: pt.mid, sd: stdWide, desc: `Normal(μ=$${pt.mid.toLocaleString()}, σ=$${stdWide.toLocaleString()})` },
        { name: set.names[2], type: "Uniform", mean: pt.mid, sd: unifRange, desc: `Uniform[$${(pt.mid - unifRange / 2).toLocaleString()}, $${(pt.mid + unifRange / 2).toLocaleString()}]` },
        { name: set.names[3], type: "Normal", mean: pt.mid - shiftAway, sd: stdTight, desc: `Normal(μ=$${(pt.mid - shiftAway).toLocaleString()}, σ=$${stdTight.toLocaleString()})` },
      ];

      const options: OptionItem[] = models.map((m, i) => {
        const p =
          m.type === "Normal"
            ? intervalProb(lo, hi, m.mean, m.sd)
            : Math.min(1, pt.width / m.sd);
        return {
          id: `model-${i}`,
          label: `${m.name}: ${m.desc}`,
          probValue: p,
          formattedProb: p < 0.001 ? "<0.1%" : pct(p, 1),
          rationale:
            m.type === "Normal"
              ? `Target window is ${(((hi - lo) / 2) / m.sd).toFixed(2)}σ wide around this mean.`
              : `Uniform density: window width / total range = ${pct(p, 1)}.`,
        };
      });

      out.push({
        id: nextId("dist"),
        category: "distribution-density",
        type: "rank-order",
        title: `${set.noun[0].toUpperCase()}${set.noun.slice(1)} Price Interval Ranking`,
        scenarioText: `Rank these 4 ${set.noun}s from MOST LIKELY to LEAST LIKELY to land between $${lo.toLocaleString()} and $${hi.toLocaleString()}.`,
        difficulty: 2,
        timeLimitSec: 40,
        distributionData: {
          targetRange: [lo, hi],
          items: models.map((m) => ({
            name: m.name,
            type: m.type,
            meanOrCenter: m.mean,
            spreadOrStdDev: m.sd,
            description: m.desc,
          })),
        },
        options,
        correctRankOrder: rankOrderFromOptions(options),
        explanation: `For a window centered near a distribution's mean, the tightest spread wins. Ranked by actual interval probability: ${rankOrderFromOptions(options)
          .map((id) => options.find((o) => o.id === id)?.formattedProb)
          .join(" > ")}.`,
      });
    }
  }
  return out;
}

// ===========================================================================
// C. Dice sums, coin-flip binomials, card hands
// ===========================================================================
function countDiceSumWays(dice: number, sum: number): number {
  let count = 0;
  const rec = (remaining: number, total: number) => {
    if (remaining === 0) {
      if (total === sum) count++;
      return;
    }
    for (let f = 1; f <= 6; f++) rec(remaining - 1, total + f);
  };
  rec(dice, 0);
  return count;
}
const DICE_TOTAL: Record<number, number> = { 1: 6, 2: 36, 3: 216, 4: 1296 };

function genDiceCardQuestions(): ProbabilityRankingQuestion[] {
  const out: ProbabilityRankingQuestion[] = [];

  // Dice-sum comparisons: pick 3 (dice count, target sum) pairs and rank.
  for (let variant = 0; variant < 20; variant++) {
    const configs: { dice: number; sum: number }[] = [];
    const usedDice = pick([2, 3]);
    const possibleSums = Array.from({ length: usedDice * 5 + 1 }, (_, i) => i + usedDice).filter(
      (s) => s >= usedDice && s <= usedDice * 6
    );
    while (configs.length < 3) {
      const sum = pick(possibleSums);
      if (!configs.some((c) => c.sum === sum)) configs.push({ dice: usedDice, sum });
    }
    const options: OptionItem[] = configs.map((c, i) => {
      const ways = countDiceSumWays(c.dice, c.sum);
      const total = DICE_TOTAL[c.dice];
      const p = ways / total;
      return {
        id: `dicesum-${i}`,
        label: `Rolling a sum of ${c.sum} with ${c.dice} fair dice`,
        probValue: p,
        formattedProb: pct(p, 2),
        rationale: `${ways} ways out of ${total} total outcomes = ${pct(p, 2)}.`,
      };
    });
    out.push({
      id: nextId("dicesum"),
      category: "dice-and-cards",
      type: "rank-order",
      title: `${usedDice}-Dice Sum Likelihood`,
      scenarioText: `Rank the following sums, each rolled with ${usedDice} fair 6-sided dice, from MOST LIKELY to LEAST LIKELY.`,
      difficulty: usedDice === 3 ? 2 : 1,
      timeLimitSec: 35,
      options,
      correctRankOrder: rankOrderFromOptions(options),
      explanation: `Count the ways each sum can be made out of ${DICE_TOTAL[usedDice]} equally likely outcomes, then compare: ${rankOrderFromOptions(options)
        .map((id) => options.find((o) => o.id === id)?.formattedProb)
        .join(" > ")}.`,
    });
  }

  // Binomial coin-flip comparisons.
  const COIN_CONFIGS = [
    { n: 4, k: 4 }, { n: 4, k: 3 }, { n: 4, k: 2 }, { n: 4, k: 1 }, { n: 4, k: 0 },
    { n: 5, k: 5 }, { n: 5, k: 4 }, { n: 5, k: 3 }, { n: 5, k: 2 },
    { n: 6, k: 6 }, { n: 6, k: 5 }, { n: 6, k: 3 }, { n: 6, k: 0 },
  ];
  for (let variant = 0; variant < 15; variant++) {
    const chosen: { n: number; k: number }[] = [];
    while (chosen.length < 3) {
      const c = pick(COIN_CONFIGS);
      if (!chosen.some((x) => x.n === c.n && x.k === c.k)) chosen.push(c);
    }
    const options: OptionItem[] = chosen.map((c, i) => {
      const p = comb(c.n, c.k) * Math.pow(0.5, c.n);
      return {
        id: `coin-${i}`,
        label: `Exactly ${c.k} heads in ${c.n} fair coin flips`,
        probValue: p,
        formattedProb: pct(p, 2),
        rationale: `C(${c.n},${c.k}) × 0.5^${c.n} = ${pct(p, 2)}.`,
      };
    });
    out.push({
      id: nextId("coin"),
      category: "dice-and-cards",
      type: "rank-order",
      title: "Binomial Coin Toss Likelihoods",
      scenarioText: "Rank the following fair-coin outcomes from MOST LIKELY to LEAST LIKELY.",
      difficulty: 1,
      timeLimitSec: 30,
      options,
      correctRankOrder: rankOrderFromOptions(options),
      explanation: `Binomial P(k; n, 0.5) = C(n,k) × 0.5ⁿ, compared directly: ${rankOrderFromOptions(options)
        .map((id) => options.find((o) => o.id === id)?.formattedProb)
        .join(" > ")}.`,
    });
  }

  // Card-hand hypergeometric comparisons (deck of 52, 13 of each suit).
  for (let variant = 0; variant < 15; variant++) {
    const handSize = pick([3, 4, 5]);
    const kChoices = Array.from({ length: Math.min(handSize, 4) + 1 }, (_, i) => i);
    const chosenK: number[] = [];
    while (chosenK.length < 3) {
      const k = pick(kChoices);
      if (!chosenK.includes(k)) chosenK.push(k);
    }
    const options: OptionItem[] = chosenK.map((k, i) => {
      const p = hypergeom(52, 13, handSize, k);
      return {
        id: `hand-${i}`,
        label: `Exactly ${k} heart${k === 1 ? "" : "s"} in a ${handSize}-card hand`,
        probValue: p,
        formattedProb: pct(p, 2),
        rationale: `Hypergeometric: C(13,${k})·C(39,${handSize - k}) / C(52,${handSize}) = ${pct(p, 2)}.`,
      };
    });
    out.push({
      id: nextId("hand"),
      category: "dice-and-cards",
      type: "rank-order",
      title: `${handSize}-Card Hand Suit Distribution`,
      scenarioText: `A ${handSize}-card hand is dealt from a shuffled 52-card deck. Rank the following outcomes from MOST LIKELY to LEAST LIKELY.`,
      difficulty: 3,
      timeLimitSec: 40,
      options,
      correctRankOrder: rankOrderFromOptions(options),
      explanation: `Hypergeometric probabilities for drawing hearts without replacement: ${rankOrderFromOptions(options)
        .map((id) => options.find((o) => o.id === id)?.formattedProb)
        .join(" > ")}.`,
    });
  }

  return out;
}

// ===========================================================================
// D. Poisson arrival processes
// ===========================================================================
const POISSON_CONTEXTS = [
  { name: "order book packet arrivals", lambda: 4, unit: "ms" },
  { name: "exchange trade executions", lambda: 2, unit: "sec" },
  { name: "customer support tickets", lambda: 1.5, unit: "min" },
  { name: "website page views", lambda: 12, unit: "sec" },
  { name: "radioactive decay counts", lambda: 3, unit: "sec" },
  { name: "call center inbound calls", lambda: 6, unit: "min" },
];

function genPoissonQuestions(): ProbabilityRankingQuestion[] {
  const out: ProbabilityRankingQuestion[] = [];
  for (const ctx of POISSON_CONTEXTS) {
    for (let variant = 0; variant < 5; variant++) {
      const tMultipliers = [0.25, 0.5, 1, 1.5, 2];
      const chosenT = [pick(tMultipliers), pick(tMultipliers), pick(tMultipliers)].filter(
        (t, i, arr) => arr.indexOf(t) === i
      );
      while (chosenT.length < 3) {
        const t = pick(tMultipliers);
        if (!chosenT.includes(t)) chosenT.push(t);
      }
      const kMode = pick(["zero", "atleastone", "exact"] as const);
      const options: OptionItem[] = chosenT.slice(0, 3).map((t, i) => {
        const lambdaT = ctx.lambda * t;
        let p: number;
        let label: string;
        let rationale: string;
        if (kMode === "zero") {
          p = poissonPmf(0, lambdaT);
          label = `Zero arrivals in a ${t} ${ctx.unit} window`;
          rationale = `e^(−${lambdaT.toFixed(2)}) ≈ ${pct(p, 2)}.`;
        } else if (kMode === "atleastone") {
          p = 1 - poissonPmf(0, lambdaT);
          label = `At least 1 arrival in a ${t} ${ctx.unit} window`;
          rationale = `1 − e^(−${lambdaT.toFixed(2)}) ≈ ${pct(p, 2)}.`;
        } else {
          const k = 1 + (i % 2);
          p = poissonPmf(k, lambdaT);
          label = `Exactly ${k} arrival${k === 1 ? "" : "s"} in a ${t} ${ctx.unit} window`;
          rationale = `e^(−${lambdaT.toFixed(2)})·${lambdaT.toFixed(2)}^${k}/${k}! ≈ ${pct(p, 2)}.`;
        }
        return { id: `pois-${i}`, label, probValue: p, formattedProb: pct(p, 2), rationale };
      });
      out.push({
        id: nextId("poisson"),
        category: "poisson-arrivals",
        type: "rank-order",
        title: `${ctx.name[0].toUpperCase()}${ctx.name.slice(1)} (λ=${ctx.lambda}/${ctx.unit})`,
        scenarioText: `${ctx.name[0].toUpperCase()}${ctx.name.slice(1)} follow a Poisson process at λ = ${ctx.lambda}/${ctx.unit}. Rank the following events from MOST LIKELY to LEAST LIKELY.`,
        difficulty: 3,
        timeLimitSec: 40,
        options,
        correctRankOrder: rankOrderFromOptions(options),
        explanation: `Poisson P(X=k) = e^(−λt)·(λt)^k / k!. Ordered by exact probability mass: ${rankOrderFromOptions(options)
          .map((id) => options.find((o) => o.id === id)?.formattedProb)
          .join(" > ")}.`,
      });
    }
  }
  return out;
}

// ===========================================================================
// E. Bayesian urns & base-rate reasoning
// ===========================================================================
function genBayesianQuestions(): ProbabilityRankingQuestion[] {
  const out: ProbabilityRankingQuestion[] = [];

  // Urn draws without replacement.
  const URN_CONFIGS = [
    { total: 10, favorable: 6, draws: 3, colorName: "red" },
    { total: 12, favorable: 5, draws: 4, colorName: "blue" },
    { total: 15, favorable: 9, draws: 3, colorName: "green" },
    { total: 20, favorable: 8, draws: 4, colorName: "gold" },
  ];
  for (const cfg of URN_CONFIGS) {
    for (let variant = 0; variant < 6; variant++) {
      const kChoices = Array.from({ length: cfg.draws + 1 }, (_, i) => i);
      const chosenK: number[] = [];
      while (chosenK.length < 3) {
        const k = pick(kChoices);
        if (!chosenK.includes(k)) chosenK.push(k);
      }
      const other = cfg.total - cfg.favorable;
      const options: OptionItem[] = chosenK.map((k, i) => {
        const p = hypergeom(cfg.total, cfg.favorable, cfg.draws, k);
        return {
          id: `urn-${i}`,
          label: `Exactly ${k} ${cfg.colorName} ball${k === 1 ? "" : "s"} drawn`,
          probValue: p,
          formattedProb: pct(p, 2),
          rationale: `C(${cfg.favorable},${k})·C(${other},${cfg.draws - k}) / C(${cfg.total},${cfg.draws}) = ${pct(p, 2)}.`,
        };
      });
      out.push({
        id: nextId("urn"),
        category: "bayesian-urns",
        type: "rank-order",
        title: `Urn Draw Without Replacement`,
        scenarioText: `An urn holds ${cfg.total} balls: ${cfg.favorable} ${cfg.colorName} and ${other} of another color. You draw ${cfg.draws} without replacement. Rank the following outcomes from MOST LIKELY to LEAST LIKELY.`,
        difficulty: 2,
        timeLimitSec: 40,
        options,
        correctRankOrder: rankOrderFromOptions(options),
        explanation: `Hypergeometric probability for each count of ${cfg.colorName} balls among ${cfg.draws} draws: ${rankOrderFromOptions(options)
          .map((id) => options.find((o) => o.id === id)?.formattedProb)
          .join(" > ")}.`,
      });
    }
  }

  // Bayes' theorem / positive predictive value across base rates.
  const SENS_SPEC_PAIRS = [
    { sens: 0.95, spec: 0.9 },
    { sens: 0.99, spec: 0.95 },
    { sens: 0.9, spec: 0.85 },
    { sens: 0.99, spec: 0.99 },
  ];
  const PRIOR_SETS = [
    [0.01, 0.05, 0.1, 0.3],
    [0.001, 0.01, 0.05, 0.2],
    [0.02, 0.08, 0.15, 0.4],
  ];
  for (const ss of SENS_SPEC_PAIRS) {
    for (const priors of PRIOR_SETS) {
      const chosenPriors = [pick(priors), pick(priors), pick(priors)].filter(
        (p, i, arr) => arr.indexOf(p) === i
      );
      while (chosenPriors.length < 3) {
        const p = pick(priors);
        if (!chosenPriors.includes(p)) chosenPriors.push(p);
      }
      const options: OptionItem[] = chosenPriors.slice(0, 3).map((prior, i) => {
        const fp = 1 - ss.spec;
        const ppv = (ss.sens * prior) / (ss.sens * prior + fp * (1 - prior));
        return {
          id: `bayes-${i}`,
          label: `Population with ${pct(prior, 1)} base rate`,
          probValue: ppv,
          formattedProb: pct(ppv, 1),
          rationale: `PPV = (${ss.sens}×${prior}) / (${ss.sens}×${prior} + ${fp.toFixed(2)}×${(1 - prior).toFixed(2)}) ≈ ${pct(ppv, 1)}.`,
        };
      });
      out.push({
        id: nextId("bayes"),
        category: "bayesian-urns",
        type: "rank-order",
        title: `Positive Predictive Value (sens=${pct(ss.sens, 0)}, spec=${pct(ss.spec, 0)})`,
        scenarioText: `A test has ${pct(ss.sens, 0)} sensitivity and ${pct(ss.spec, 0)} specificity. Rank these populations, each with a different disease base rate, from MOST LIKELY to LEAST LIKELY to actually have the disease given a positive result.`,
        difficulty: 3,
        timeLimitSec: 45,
        options,
        correctRankOrder: rankOrderFromOptions(options),
        explanation: `Bayes' theorem: P(disease|positive) = sens·prior / [sens·prior + (1−spec)·(1−prior)]. Higher base rate always yields higher positive predictive value for a fixed test: ${rankOrderFromOptions(options)
          .map((id) => options.find((o) => o.id === id)?.formattedProb)
          .join(" > ")}.`,
      });
    }
  }

  return out;
}

/**
 * Builds the full procedural pool. Called fresh on every menu visit so the
 * specific numbers (and which options get drawn) vary between plays.
 */
export function getProceduralProbabilityQuestions(): ProbabilityRankingQuestion[] {
  return [
    ...genStudentQuestions(),
    ...genDistributionQuestions(),
    ...genDiceCardQuestions(),
    ...genPoissonQuestions(),
    ...genBayesianQuestions(),
  ];
}
