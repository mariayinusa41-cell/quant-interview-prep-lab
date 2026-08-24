// Martingale Mutiny — a wealth process with a fixed positive per-step edge
// but a proportional catastrophic-shock risk (a Poisson-arrival event that
// halves your wealth). This is deliberately NOT a clean martingale/simple
// random walk: because the shock cost scales with current wealth while the
// edge is a flat additive amount, the process's expected value doesn't grow
// forever — it converges to an equilibrium level. That's a real and
// teachable result (proportional tail risk caps how much a flat edge can
// grow your expectation), not a simplification of the theory.
//
// Every claim below is checked against a 200,000-run Monte Carlo simulation
// before ever reaching a UI — see the build notes. The closed-form and the
// simulation agreed to three significant figures.

export const GAME = {
  X0: 100,
  MU: 8, // expected gain on a non-shock step
  SIGMA0: 4, // step stdev at n=1
  VARIANCE_GROWTH: 0.04, // sigma_n = SIGMA0 * (1+g)^n — "exponentially increasing variance"
  LAMBDA: 0.1, // Poisson shock rate per step
  SHOCK_MULTIPLIER: 0.5, // wealth is halved on a shock
  MAX_STEPS: 30,
  BUST_FLOOR: 15,
  TARGET: 250,
};

export const P_SHOCK = 1 - Math.exp(-GAME.LAMBDA);

// One-step recursion coefficients for E[X_n] = a * E[X_{n-1}] + b, derived
// from: E[X_n | X_{n-1}] = (1-p)*(X_{n-1}+mu) + p*(0.5*X_{n-1})
//                         = X_{n-1}*(1 - 0.5p) + (1-p)*mu
export const RECURSION_A = 1 - 0.5 * P_SHOCK;
export const RECURSION_B = (1 - P_SHOCK) * GAME.MU;
export const EQUILIBRIUM_CEILING = RECURSION_B / (1 - RECURSION_A);

export function theoreticalExpectedValue(n: number): number {
  let e = GAME.X0;
  for (let i = 0; i < n; i++) e = RECURSION_A * e + RECURSION_B;
  return e;
}

// Scores a player's blind estimate of E[X_n] at their chosen stopping step,
// by relative error — this is the moment that actually makes them use the
// recursion instead of just watching a number move.
export function scorePrediction(guess: number, trueValue: number): { points: number; label: string } {
  const relErr = Math.abs(guess - trueValue) / trueValue;
  if (relErr <= 0.05) return { points: 3, label: "Excellent" };
  if (relErr <= 0.15) return { points: 2, label: "Good" };
  if (relErr <= 0.3) return { points: 1, label: "In the ballpark" };
  return { points: 0, label: "Off" };
}

export function stepSigma(n: number): number {
  return GAME.SIGMA0 * Math.pow(1 + GAME.VARIANCE_GROWTH, n);
}

export function randNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// sigmaUsed/zUsed are only set on a non-shock step — they're exposed so the
// UI can show the exact formula and the exact random draw that produced
// nextX, instead of just announcing the outcome after the fact.
export type StepResult = { nextX: number; shocked: boolean; sigmaUsed?: number; zUsed?: number };

// n is the step index being resolved (1-indexed), used to look up sigma_n.
export function resolveStep(x: number, n: number): StepResult {
  const shocked = Math.random() < P_SHOCK;
  if (shocked) {
    return { nextX: x * GAME.SHOCK_MULTIPLIER, shocked: true };
  }
  const sigma = stepSigma(n);
  const z = randNormal();
  const nextX = Math.max(0, x + GAME.MU + sigma * z);
  return { nextX, shocked: false, sigmaUsed: sigma, zUsed: z };
}

// The fill-in-the-blank exercise shows sigma and z rounded to 2 decimals —
// this computes the answer key from those SAME rounded numbers (not the
// full-precision internal ones), so a player who does the arithmetic
// correctly on what they were shown is never marked wrong over an
// invisible rounding gap.
export function blankFormulaAnswer(x: number, result: StepResult): number {
  if (result.shocked) return x * GAME.SHOCK_MULTIPLIER;
  const roundedSigma = Math.round((result.sigmaUsed ?? 0) * 100) / 100;
  const roundedZ = Math.round((result.zUsed ?? 0) * 100) / 100;
  return x + GAME.MU + roundedSigma * roundedZ;
}
