// The Cramér–Lundberg model — actual ruin theory, not a symmetric ±1
// random walk. An insurer's surplus U(t) = u + c·t − S(t): it earns premium
// at a constant rate c, and pays out a compound Poisson claims process
// S(t) (claims arrive at rate λ, each sized ~Exp(mean μ)). Ruin is U(t) < 0
// for some t.
//
//   net profit condition   c > λμ           (loading θ = c/(λμ) − 1 > 0)
//   adjustment coefficient R = θ / ((1+θ)μ)  (solves λ + cR = λ·M_X(R) for
//                                              exponential claims, whose MGF
//                                              is M_X(s) = 1/(1−μs))
//   exact ruin probability  ψ(u) = (1/(1+θ)) · e^(−R·u)   [exponential claims]
//   Lundberg's inequality   ψ(u) ≤ e^(−R·u)               [any claim dist.]
//
// Two checkable facts used to sanity-check this before it shipped: ψ(0) =
// 1/(1+θ) exactly (start with nothing saved, still survive with positive
// probability as long as there's loading), and ψ(u) → 0 as u → ∞ at rate R —
// the further from ruin, the safer, exponentially so. Both held numerically.
// Higher loading θ (fatter premium over expected claims) raises R and
// shrinks ψ(u) at every u; higher mean claim size μ lowers R and raises it.

export const LAMBDA = 1; // expected claims per round (Poisson rate)
export const MU = 5; // mean claim size, in ticks (claims are ~Exp(mean MU))
export const START_SURPLUS = 20;
export const ROUNDS = 12;
export const THETA_OPTIONS = [0.1, 0.25, 0.5, 1.0]; // relative safety loading choices

export function premiumRate(theta: number, lambda = LAMBDA, mu = MU): number {
  return (1 + theta) * lambda * mu;
}

export function adjustmentCoefficient(theta: number, mu = MU): number {
  return theta / ((1 + theta) * mu);
}

export function ruinProbability(u: number, theta: number, mu = MU): number {
  const R = adjustmentCoefficient(theta, mu);
  return (1 / (1 + theta)) * Math.exp(-R * Math.max(u, 0));
}

export function lundbergBound(u: number, theta: number, mu = MU): number {
  const R = adjustmentCoefficient(theta, mu);
  return Math.exp(-R * Math.max(u, 0));
}

// Knuth's algorithm — fine for the small integer rates this game uses.
export function poissonSample(lambda: number, rng = Math.random): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export function exponentialSample(mean: number, rng = Math.random): number {
  return -mean * Math.log(1 - rng());
}

export type RoundOutcome = {
  claimCount: number;
  claims: number[];
  totalClaims: number;
  premium: number;
  delta: number; // premium - totalClaims
  nextSurplus: number;
  ruined: boolean;
};

export function simulateRound(surplus: number, theta: number, lambda = LAMBDA, mu = MU, rng = Math.random): RoundOutcome {
  const premium = premiumRate(theta, lambda, mu);
  const claimCount = poissonSample(lambda, rng);
  const claims = Array.from({ length: claimCount }, () => exponentialSample(mu, rng));
  const totalClaims = claims.reduce((a, b) => a + b, 0);
  const delta = premium - totalClaims;
  const nextSurplus = surplus + delta;
  return { claimCount, claims, totalClaims, premium, delta, nextSurplus, ruined: nextSurplus < 0 };
}
