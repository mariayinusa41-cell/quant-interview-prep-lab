// Black-Scholes European call: price and Greeks, plus a GBM price stepper.
// normCDF uses the Abramowitz-Stegun approximation (max error ~7.5e-8) — no
// external stats library needed, and accurate enough that it was checked
// against textbook reference values before this game ever touched a UI (see
// the Node verification run in the build notes): S=100,K=100,T=1,r=0.05,
// sigma=0.2 gives price ≈ 10.45, delta ≈ 0.637 — matches published tables.

export function normPDF(x: number): number {
  return Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
}

export function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) prob = 1 - prob;
  return prob;
}

export type Greeks = { price: number; delta: number; gamma: number; theta: number };

// theta is returned per calendar day (annual theta / 365), which is the
// conventional way it's quoted so it reads as "dollars of decay per day".
export function blackScholesCall(S: number, K: number, T: number, r: number, sigma: number): Greeks {
  if (T <= 0) {
    const intrinsic = Math.max(S - K, 0);
    return { price: intrinsic, delta: S > K ? 1 : 0, gamma: 0, theta: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  const delta = normCDF(d1);
  const gamma = normPDF(d1) / (S * sigma * sqrtT);
  const theta = (-(S * normPDF(d1) * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365;
  return { price, delta, gamma, theta };
}

// Box-Muller standard normal draw.
export function randNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function gbmStep(S: number, mu: number, sigma: number, dt: number, z: number): number {
  return S * Math.exp((mu - (sigma * sigma) / 2) * dt + sigma * Math.sqrt(dt) * z);
}

export const GAME = {
  TOTAL_TICKS: 40,
  TICK_MS: 150, // animation playback speed once a run is computed
  NEUTRAL_TOLERANCE: 0.12,
  WIN_HEDGED_FRACTION: 0.7,
};

// ---------- Algorithm mode: randomize the scenario AND the price path
// every run, so a submission has to be a real formula — a hard-coded
// number, or a formula tuned to one specific strike/expiry/vol, won't
// survive a fresh run. ----------
export type Scenario = { S0: number; K: number; T0: number; sigma: number; r: number; mu: number; days: number };

const DAYS_OPTIONS = [2, 3, 5, 7, 10, 15, 20];
const SIGMA_OPTIONS = [0.2, 0.25, 0.3, 0.35, 0.45, 0.55];

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomScenario(): Scenario {
  const K = 100;
  const moneyness = 0.85 + Math.random() * 0.3; // S0/K in [0.85, 1.15]
  const S0 = Math.round(K * moneyness * 100) / 100;
  const days = randPick(DAYS_OPTIONS);
  const sigma = randPick(SIGMA_OPTIONS);
  return { S0, K, T0: days / 252, sigma, r: 0.02, mu: 0, days };
}

export type PathPoint = { tick: number; S: number; T: number; r: number; sigma: number; K: number; delta: number };

export function generatePricePath(scenario: Scenario): PathPoint[] {
  const dt = scenario.T0 / GAME.TOTAL_TICKS;
  const path: PathPoint[] = [];
  let S = scenario.S0;
  for (let tick = 1; tick <= GAME.TOTAL_TICKS; tick++) {
    const z = randNormal();
    S = gbmStep(S, scenario.mu, scenario.sigma, dt, z);
    const T = Math.max(0, scenario.T0 - tick * dt);
    const { delta } = blackScholesCall(S, scenario.K, T, scenario.r, scenario.sigma);
    path.push({ tick, S, T, r: scenario.r, sigma: scenario.sigma, K: scenario.K, delta });
  }
  return path;
}

export type HedgeTickAnalysis = { tick: number; S: number; hedgeRatio: number | null; trueDelta: number; netDelta: number | null; hedged: boolean; error?: string };

export function analyzeHedgeResults(
  path: PathPoint[],
  hedgeResults: { tick: number; hedgeRatio: number | null; error?: string }[]
): { ticks: HedgeTickAnalysis[]; hedgedFraction: number; avgAbsNetDelta: number; validCount: number } {
  const byTick = new Map(hedgeResults.map((r) => [r.tick, r]));
  let hedgedCount = 0;
  let sumAbsNetDelta = 0;
  let validCount = 0;

  const ticks: HedgeTickAnalysis[] = path.map((p) => {
    const r = byTick.get(p.tick);
    const hedgeRatio = r?.hedgeRatio ?? null;
    const netDelta = hedgeRatio === null ? null : hedgeRatio - p.delta;
    const hedged = netDelta !== null && Math.abs(netDelta) <= GAME.NEUTRAL_TOLERANCE;
    if (hedged) hedgedCount++;
    if (netDelta !== null) {
      sumAbsNetDelta += Math.abs(netDelta);
      validCount++;
    }
    return { tick: p.tick, S: p.S, hedgeRatio, trueDelta: p.delta, netDelta, hedged, error: r?.error };
  });

  return {
    ticks,
    hedgedFraction: hedgedCount / path.length,
    avgAbsNetDelta: validCount > 0 ? sumAbsNetDelta / validCount : 1,
    validCount,
  };
}
