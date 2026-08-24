// Engine for Twenty Backtests. The lesson only lands if the numbers are real:
// strategies with genuinely zero edge must produce the same seductive equity
// curves and Sharpe ratios that fool people in practice. Nothing here is
// rigged to look good — the selection effect does all the work by itself.

export const TRADING_DAYS = 252;

export type Strategy = {
  id: number;
  name: string;
  trueEdge: number; // annualised Sharpe the generator was given. 0 = pure noise.
  returns: number[]; // in-sample daily returns
  outOfSample: number[]; // holdout period, generated from the SAME true edge
  sharpe: number; // in-sample, annualised
  oosSharpe: number;
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

function stdNormal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Annualised Sharpe from daily returns.
export function sharpe(returns: number[]): number {
  const n = returns.length;
  if (n < 2) return 0;
  const mean = returns.reduce((s, r) => s + r, 0) / n;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(variance);
  if (sd === 0) return 0;
  return (mean / sd) * Math.sqrt(TRADING_DAYS);
}

// Standard error of an ANNUALISED Sharpe estimated from T daily observations.
// Daily Sharpe has SE ~ 1/sqrt(T); annualising multiplies by sqrt(252).
// The punchline: a single year of data gives SE ~ 1.0, so a backtested
// Sharpe of 1.0 over one year is statistically indistinguishable from zero.
export function sharpeStandardError(days: number): number {
  return Math.sqrt(TRADING_DAYS / days);
}

// Inverse standard normal CDF (Acklam's rational approximation, ~1e-9).
function probit(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// Expected maximum of n draws from N(0, se^2), via Blom's approximation for
// normal order statistics. The naive sqrt(2 ln n) is the asymptotic leading
// term and badly overshoots at n = 20 (2.45 vs the true 1.87), which would
// have taught players a wrong number — this version matches simulation.
//
// This is what explains why the winner of any bake-off looks good: run 20
// zero-edge strategies and the best one is expected to sit ~1.87 standard
// errors above zero on luck alone.
export function expectedMaxSharpe(n: number, se: number): number {
  if (n < 2) return 0;
  return se * probit((n - 0.375) / (n + 0.25));
}

const NAMES = [
  "Cascade", "Ironwood", "Halcyon", "Meridian", "Blackbird", "Tessellate", "Verdigris", "Kestrel",
  "Lodestar", "Quarry", "Sable", "Windrow", "Almanac", "Beacon", "Cinder", "Drift",
  "Ember", "Fathom", "Granite", "Harbor",
];

// `edgedIndex` < 0 means every strategy is noise — the level where the correct
// answer is to fund nothing at all.
export function generateBook(
  seed: number,
  count: number,
  inSampleDays: number,
  oosDays: number,
  edgedIndex: number,
  trueEdge: number
): Strategy[] {
  const rng = mulberry32(seed);
  const book: Strategy[] = [];

  for (let i = 0; i < count; i++) {
    const edge = i === edgedIndex ? trueEdge : 0;
    // daily drift implied by an annualised Sharpe of `edge`, at 1% daily vol
    const dailyVol = 0.01;
    const dailyDrift = (edge / Math.sqrt(TRADING_DAYS)) * dailyVol;

    const returns = Array.from({ length: inSampleDays }, () => dailyDrift + dailyVol * stdNormal(rng));
    const outOfSample = Array.from({ length: oosDays }, () => dailyDrift + dailyVol * stdNormal(rng));

    book.push({
      id: i,
      name: NAMES[i % NAMES.length],
      trueEdge: edge,
      returns,
      outOfSample,
      sharpe: sharpe(returns),
      oosSharpe: sharpe(outOfSample),
    });
  }

  return book;
}

export function equityCurve(returns: number[]): number[] {
  let level = 1;
  return returns.map((r) => {
    level *= 1 + r;
    return level;
  });
}

export function totalReturn(returns: number[]): number {
  return returns.reduce((lvl, r) => lvl * (1 + r), 1) - 1;
}

export function maxDrawdown(returns: number[]): number {
  const curve = equityCurve(returns);
  let peak = curve[0] ?? 1;
  let worst = 0;
  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > worst) worst = dd;
  }
  return worst;
}
