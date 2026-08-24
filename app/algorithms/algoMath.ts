// DP puzzle generators. Every "correct" table value is computed by the same
// recurrence the player is asked to fill in, not hand-authored — so the
// answer key can never drift out of sync with the puzzle.

export type DPKind = "staircase" | "house-robber" | "coin-change";

export type DPPuzzle = {
  kind: DPKind;
  title: string;
  recurrence: string;
  prompt: string;
  n: number;
  input?: number[]; // for house-robber (values) and coin-change (coins)
  target?: number; // for coin-change
  table: number[]; // the correct dp table, index-aligned
  baseCases: number; // how many leading cells are pre-filled as given
  cellLabel: (i: number) => string;
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function buildStaircase(): DPPuzzle {
  const n = randInt(6, 10);
  const table = new Array(n + 1).fill(0);
  table[0] = 1;
  table[1] = 1;
  for (let i = 2; i <= n; i++) table[i] = table[i - 1] + table[i - 2];
  return {
    kind: "staircase",
    title: "Staircase Climb",
    recurrence: "ways(n) = ways(n-1) + ways(n-2)",
    prompt: `How many distinct ways are there to climb ${n} stairs, taking 1 or 2 steps at a time?`,
    n,
    table,
    baseCases: 2,
    cellLabel: (i) => `ways(${i})`,
  };
}

export function buildHouseRobber(): DPPuzzle {
  const n = randInt(6, 9);
  const values = Array.from({ length: n }, () => randInt(2, 15));
  const table = new Array(n).fill(0);
  table[0] = values[0];
  table[1] = Math.max(values[0], values[1]);
  for (let i = 2; i < n; i++) table[i] = Math.max(table[i - 1], table[i - 2] + values[i]);
  return {
    kind: "house-robber",
    title: "House Robber",
    recurrence: "best(i) = max(best(i-1), best(i-2) + value[i])",
    prompt: `A row of ${n} houses holds these amounts: [${values.join(", ")}]. You can't rob two adjacent houses. What's the most you can take?`,
    n,
    input: values,
    table,
    baseCases: 2,
    cellLabel: (i) => `best(${i})`,
  };
}

export function buildCoinChange(): DPPuzzle {
  // Every set includes a 1-coin so no amount in range is ever unreachable —
  // {2, 3, 5} (dropped) can't make 1, which left an early cell's "correct"
  // answer as the internal INF sentinel with no reasonable value to type in.
  const coinSets = [
    [1, 3, 4],
    [1, 2, 5],
    [1, 4, 5],
    [1, 2, 4],
  ];
  const coins = coinSets[randInt(0, coinSets.length - 1)];
  const target = randInt(7, 13);
  const INF = 1e9;
  const table = new Array(target + 1).fill(INF);
  table[0] = 0;
  for (let amt = 1; amt <= target; amt++) {
    for (const c of coins) {
      if (c <= amt && table[amt - c] + 1 < table[amt]) table[amt] = table[amt - c] + 1;
    }
  }
  return {
    kind: "coin-change",
    title: "Coin Change",
    recurrence: "min(amt) = 1 + min over coins c<=amt of min(amt-c)",
    prompt: `Using coins [${coins.join(", ")}] (unlimited supply), what's the fewest coins that make exactly ${target}?`,
    n: target,
    input: coins,
    target,
    table,
    baseCases: 1,
    cellLabel: (i) => `min(${i})`,
  };
}

export function randomDPPuzzle(): DPPuzzle {
  const builders = [buildStaircase, buildHouseRobber, buildCoinChange];
  return builders[randInt(0, builders.length - 1)]();
}

// ---------- Monte Carlo π estimator ----------
// Standard error of a Monte Carlo mean estimator: SE = s / sqrt(N). For the
// circle-in-square π estimator specifically, Var(indicator) = p(1-p) with
// p = π/4, so s = sqrt(p(1-p)) — used to answer "how many more samples to
// halve the error" without hand-authoring that number either.
export function piEstimatorStdDev(): number {
  const p = Math.PI / 4;
  return Math.sqrt(p * (1 - p));
}

export function samplePiEstimate(n: number): { estimate: number; inside: number } {
  let inside = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.random();
    const y = Math.random();
    if (x * x + y * y <= 1) inside++;
  }
  return { estimate: (4 * inside) / n, inside };
}
