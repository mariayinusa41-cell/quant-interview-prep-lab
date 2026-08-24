// Core engine for Crack the Bot. A hidden rule drives an algorithmic trader;
// the player infers it from observed behaviour. All the statistics here are
// real — ordinary least squares with proper standard errors and t-statistics,
// not a scripted "you found it!" — because the whole point is that the player
// learns to read a t-stat and to distinguish signal from variance.

export type BotRule = "momentum" | "reversion" | "lag3" | "trend" | "random";

export const RULE_LABEL: Record<BotRule, string> = {
  momentum: "Momentum — follows the last move",
  reversion: "Mean reversion — fades the last move",
  lag3: "Delayed — reacts to the move 3 ticks ago",
  trend: "Trend — follows the 5-tick average",
  random: "No rule — it's trading randomly",
};

export const RULE_ORDER: BotRule[] = ["momentum", "reversion", "lag3", "trend", "random"];

export type Observation = {
  tick: number;
  price: number;
  change: number; // price change into this tick
  action: -1 | 0 | 1; // what the bot did: sell / nothing / buy
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

// `fireRate` is how often the rule actually drives the action; the rest of the
// time the bot acts at random. Lower fire rates are the whole difficulty
// curve — the signal is still there, it just needs more data to establish.
export function generateSession(rule: BotRule, seed: number, length: number, fireRate: number): Observation[] {
  const rng = mulberry32(seed);
  const obs: Observation[] = [];
  let price = 100;
  const changes: number[] = [];

  for (let i = 0; i < length; i++) {
    const change = Math.round((rng() - 0.5) * 8); // integer tick move, roughly -4..+4
    price += change;
    changes.push(change);

    let action: -1 | 0 | 1;
    const follows = rng() < fireRate;

    if (!follows || rule === "random") {
      action = (rng() < 0.5 ? -1 : 1) as -1 | 1;
    } else {
      switch (rule) {
        case "momentum": {
          const last = changes[changes.length - 2] ?? 0;
          action = last >= 0 ? 1 : -1;
          break;
        }
        case "reversion": {
          const last = changes[changes.length - 2] ?? 0;
          action = last >= 0 ? -1 : 1;
          break;
        }
        case "lag3": {
          const lagged = changes[changes.length - 4] ?? 0;
          action = lagged >= 0 ? 1 : -1;
          break;
        }
        case "trend": {
          const window = changes.slice(Math.max(0, changes.length - 6), changes.length - 1);
          const avg = window.length ? window.reduce((s, c) => s + c, 0) / window.length : 0;
          action = avg >= 0 ? 1 : -1;
          break;
        }
        default:
          action = 1;
      }
    }

    obs.push({ tick: i + 1, price, change, action });
  }

  return obs;
}

// The candidate explanatory variables the player can regress the bot's action
// against. Each one corresponds to a hypothesis about what it's watching.
export type Predictor = { id: string; label: string; hypothesis: BotRule };

export const PREDICTORS: Predictor[] = [
  { id: "lag1", label: "Previous tick's move", hypothesis: "momentum" },
  { id: "lag3", label: "Move 3 ticks ago", hypothesis: "lag3" },
  { id: "ma5", label: "Average of last 5 moves", hypothesis: "trend" },
];

export function predictorValue(id: string, obs: Observation[], i: number): number | null {
  if (id === "lag1") return i >= 1 ? obs[i - 1].change : null;
  if (id === "lag3") return i >= 3 ? obs[i - 3].change : null;
  if (id === "ma5") {
    if (i < 5) return null;
    const window = obs.slice(i - 5, i);
    return window.reduce((s, o) => s + o.change, 0) / window.length;
  }
  return null;
}

export type RegressionResult = {
  n: number;
  slope: number;
  tStat: number;
  pValue: number;
  significant: boolean;
};

// Standard normal CDF via Abramowitz & Stegun 7.1.26 — good to ~1e-7, plenty
// for turning a t-stat into a readable p-value at these sample sizes.
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

// Simple OLS of ys on xs — the one-predictor engine shared by `regress`
// (predictor → bot action) and `auxRegress` (predictor → predictor, used
// for the omitted-variable-bias check below). Generic in what the two
// series actually mean; the statistics don't care.
function olsSimple(xs: number[], ys: number[]): RegressionResult {
  const n = xs.length;
  if (n < 3) return { n, slope: 0, tStat: 0, pValue: 1, significant: false };

  const xBar = xs.reduce((s, v) => s + v, 0) / n;
  const yBar = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - xBar) * (ys[i] - yBar);
    sxx += (xs[i] - xBar) ** 2;
  }
  if (sxx === 0) return { n, slope: 0, tStat: 0, pValue: 1, significant: false };

  const slope = sxy / sxx;
  const intercept = yBar - slope * xBar;

  let sse = 0;
  for (let i = 0; i < n; i++) {
    const resid = ys[i] - (intercept + slope * xs[i]);
    sse += resid * resid;
  }
  const sigma2 = sse / (n - 2);
  const se = Math.sqrt(sigma2 / sxx);
  const tStat = se === 0 ? 0 : slope / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(tStat)));

  return { n, slope, tStat, pValue, significant: pValue < 0.05 };
}

// OLS of action on a single predictor — the "naive" regression a player
// runs first. If the true driver is a different, correlated predictor, this
// slope can look real and significant purely from that correlation. That's
// the trap the confounder check below is built to catch.
export function regress(obs: Observation[], predictorId: string): RegressionResult {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < obs.length; i++) {
    const x = predictorValue(predictorId, obs, i);
    if (x === null) continue;
    xs.push(x);
    ys.push(obs[i].action);
  }
  return olsSimple(xs, ys);
}

// Regress one predictor's values on another's — the auxiliary regression in
// the omitted-variable-bias identity: bias in the naive slope on X from
// dropping Z equals β_Z(partial) × (this slope, Z regressed on X). It's
// genuinely nonzero here: `ma5`'s window overlaps `lag1` and `lag3`, so they
// really are correlated, not just coincidentally.
export function auxRegress(obs: Observation[], includedId: string, omittedId: string): RegressionResult {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < obs.length; i++) {
    const x = predictorValue(includedId, obs, i);
    const y = predictorValue(omittedId, obs, i);
    if (x === null || y === null) continue;
    xs.push(x);
    ys.push(y);
  }
  return olsSimple(xs, ys);
}

export type MultiRegressionResult = {
  n: number;
  betaX: number;
  betaZ: number;
  tX: number;
  tZ: number;
  pX: number;
  pZ: number;
};

// Two-predictor OLS of action on X and Z together, via the closed-form
// normal equations (2x2 system — no matrix library needed). `betaX` here is
// the PARTIAL effect of X, holding Z fixed — comparing it against the naive
// single-predictor slope on X is exactly how you catch an omitted variable.
export function multiRegress(obs: Observation[], idX: string, idZ: string): MultiRegressionResult {
  const xs: number[] = [];
  const zs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < obs.length; i++) {
    const x = predictorValue(idX, obs, i);
    const z = predictorValue(idZ, obs, i);
    if (x === null || z === null) continue;
    xs.push(x);
    zs.push(z);
    ys.push(obs[i].action);
  }

  const n = xs.length;
  const empty: MultiRegressionResult = { n, betaX: 0, betaZ: 0, tX: 0, tZ: 0, pX: 1, pZ: 1 };
  if (n < 4) return empty;

  const xBar = xs.reduce((s, v) => s + v, 0) / n;
  const zBar = zs.reduce((s, v) => s + v, 0) / n;
  const yBar = ys.reduce((s, v) => s + v, 0) / n;
  let Sxx = 0;
  let Szz = 0;
  let Sxz = 0;
  let Sxy = 0;
  let Szy = 0;
  for (let i = 0; i < n; i++) {
    const cx = xs[i] - xBar;
    const cz = zs[i] - zBar;
    const cy = ys[i] - yBar;
    Sxx += cx * cx;
    Szz += cz * cz;
    Sxz += cx * cz;
    Sxy += cx * cy;
    Szy += cz * cy;
  }
  const det = Sxx * Szz - Sxz * Sxz;
  if (det === 0) return empty;

  const betaX = (Sxy * Szz - Szy * Sxz) / det;
  const betaZ = (Szy * Sxx - Sxy * Sxz) / det;
  const intercept = yBar - betaX * xBar - betaZ * zBar;

  let sse = 0;
  for (let i = 0; i < n; i++) {
    const resid = ys[i] - (intercept + betaX * xs[i] + betaZ * zs[i]);
    sse += resid * resid;
  }
  const sigma2 = sse / (n - 3);
  const seX = Math.sqrt((sigma2 * Szz) / det);
  const seZ = Math.sqrt((sigma2 * Sxx) / det);
  const tX = seX === 0 ? 0 : betaX / seX;
  const tZ = seZ === 0 ? 0 : betaZ / seZ;
  const pX = 2 * (1 - normalCdf(Math.abs(tX)));
  const pZ = 2 * (1 - normalCdf(Math.abs(tZ)));

  return { n, betaX, betaZ, tX, tZ, pX, pZ };
}

// Bonferroni: testing 3 predictors at once inflates the false-positive rate,
// so the honest threshold is 0.05/3. Teaching this is half the point of the
// no-rule level.
export function bonferroniThreshold(numTests: number): number {
  return 0.05 / numTests;
}

export function ruleForPrediction(rule: BotRule, obs: Observation[]): -1 | 1 {
  const changes = obs.map((o) => o.change);
  switch (rule) {
    case "momentum":
      return (changes[changes.length - 1] ?? 0) >= 0 ? 1 : -1;
    case "reversion":
      return (changes[changes.length - 1] ?? 0) >= 0 ? -1 : 1;
    case "lag3":
      return (changes[changes.length - 3] ?? 0) >= 0 ? 1 : -1;
    case "trend": {
      const window = changes.slice(-5);
      const avg = window.length ? window.reduce((s, c) => s + c, 0) / window.length : 0;
      return avg >= 0 ? 1 : -1;
    }
    default:
      return 1;
  }
}
