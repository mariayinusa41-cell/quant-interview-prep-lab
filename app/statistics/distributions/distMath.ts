// Samplers and moments for the distributions game. Each distribution carries a
// quant framing, because "which distribution is this" only matters if you know
// what it models — order arrivals are Poisson, waiting times are exponential,
// compounded prices are lognormal.

export type DistId = "normal" | "uniform" | "exponential" | "binomial" | "poisson" | "lognormal";

export type DistSpec = {
  id: DistId;
  label: string;
  quantUse: string;
  tell: string; // the giveaway a player should learn to spot
  discrete: boolean;
  params: Record<string, number>;
  mean: number;
  variance: number;
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

// Box-Muller: two uniforms in, one standard normal out.
function stdNormal(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Knuth's method — fine for the small lambdas used here.
function poissonSample(rng: () => number, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export function buildSpec(id: DistId, rng: () => number): DistSpec {
  switch (id) {
    case "normal": {
      const mu = Math.round(8 + rng() * 8);
      const sigma = Math.round((1.5 + rng() * 2) * 10) / 10;
      return {
        id,
        label: "Normal",
        quantUse: "Daily returns, under the naive model everyone starts with.",
        tell: "Symmetric bell, unbounded both ways, thin tails.",
        discrete: false,
        params: { mu, sigma },
        mean: mu,
        variance: sigma * sigma,
      };
    }
    case "uniform": {
      const a = Math.round(2 + rng() * 4);
      const b = a + Math.round(8 + rng() * 8);
      return {
        id,
        label: "Uniform",
        quantUse: "A price equally likely to land anywhere in a fixed band.",
        tell: "Flat top, hard edges on both sides — nothing outside the range.",
        discrete: false,
        params: { a, b },
        mean: (a + b) / 2,
        variance: (b - a) ** 2 / 12,
      };
    }
    case "exponential": {
      const lambda = Math.round((0.15 + rng() * 0.25) * 100) / 100;
      return {
        id,
        label: "Exponential",
        quantUse: "Time you wait between one trade printing and the next.",
        tell: "Starts high at zero and decays. Strictly positive, heavily right-skewed.",
        discrete: false,
        params: { lambda },
        mean: 1 / lambda,
        variance: 1 / (lambda * lambda),
      };
    }
    case "binomial": {
      const n = 20;
      const p = Math.round((0.3 + rng() * 0.4) * 100) / 100;
      return {
        id,
        label: "Binomial",
        quantUse: "How many of the next 20 sessions close up.",
        tell: "Discrete counts, bounded at 0 and n, roughly symmetric near p = 0.5.",
        discrete: true,
        params: { n, p },
        mean: n * p,
        variance: n * p * (1 - p),
      };
    }
    case "poisson": {
      const lambda = Math.round((3 + rng() * 6) * 10) / 10;
      return {
        id,
        label: "Poisson",
        quantUse: "Number of orders hitting the book in a one-second window.",
        tell: "Discrete counts, unbounded above, and the giveaway: mean ≈ variance.",
        discrete: true,
        params: { lambda },
        mean: lambda,
        variance: lambda,
      };
    }
    case "lognormal": {
      const mu = Math.round((1.6 + rng() * 0.6) * 100) / 100;
      const sigma = Math.round((0.5 + rng() * 0.3) * 100) / 100;
      return {
        id,
        label: "Lognormal",
        quantUse: "A price level after compounding many small random returns.",
        tell: "Positive only, sharp left rise, long fat tail to the right.",
        discrete: false,
        params: { mu, sigma },
        mean: Math.exp(mu + (sigma * sigma) / 2),
        variance: (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma),
      };
    }
  }
}

export function sample(spec: DistSpec, rng: () => number): number {
  const p = spec.params;
  switch (spec.id) {
    case "normal":
      return p.mu + p.sigma * stdNormal(rng);
    case "uniform":
      return p.a + rng() * (p.b - p.a);
    case "exponential":
      return -Math.log(1 - rng()) / p.lambda;
    case "binomial": {
      let k = 0;
      for (let i = 0; i < p.n; i++) if (rng() < p.p) k += 1;
      return k;
    }
    case "poisson":
      return poissonSample(rng, p.lambda);
    case "lognormal":
      return Math.exp(p.mu + p.sigma * stdNormal(rng));
  }
}

export function makeRng(seed: number) {
  return mulberry32(seed);
}

export type Histogram = { bins: number[]; min: number; max: number; width: number };

export function histogram(values: number[], binCount = 22): Histogram {
  if (values.length === 0) return { bins: new Array(binCount).fill(0), min: 0, max: 1, width: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const width = span / binCount;
  const bins = new Array(binCount).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx] += 1;
  }
  return { bins, min, max, width };
}

export function sampleStats(values: number[]) {
  const n = values.length;
  if (n === 0) return { n: 0, mean: 0, variance: 0, skew: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = n > 1 ? values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const sd = Math.sqrt(variance);
  const skew =
    n > 2 && sd > 0 ? values.reduce((s, v) => s + ((v - mean) / sd) ** 3, 0) / n : 0;
  return { n, mean, variance, skew };
}

// The CLT round: repeatedly draw `sampleSize` values and keep the MEAN. The
// resulting collection goes normal regardless of what the source looked like —
// which is the entire point and far more convincing seen than described.
export function sampleMeans(spec: DistSpec, rng: () => number, sampleSize: number, count: number): number[] {
  const means: number[] = [];
  for (let i = 0; i < count; i++) {
    let total = 0;
    for (let j = 0; j < sampleSize; j++) total += sample(spec, rng);
    means.push(total / sampleSize);
  }
  return means;
}

export const ALL_DISTS: DistId[] = ["normal", "uniform", "exponential", "binomial", "poisson", "lognormal"];
