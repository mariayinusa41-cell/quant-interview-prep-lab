// Chain Ladder and Bornhuetter-Ferguson reserving.
//
// A run-off triangle holds CUMULATIVE paid claims: rows are origin (accident)
// years, columns are development years. The upper-left is history; the
// lower-right is what has not been paid yet and must be estimated.

export type Triangle = number[][]; // triangle[origin][dev], ragged

/**
 * Volume-weighted (chain ladder) link ratio for each development step.
 *
 * LDF_j = sum_i C[i][j+1] / sum_i C[i][j], summed only over origin years
 * where BOTH columns are known. Volume weighting is the standard estimator
 * because it weights each year by its exposure rather than treating a tiny
 * immature year the same as a large mature one.
 */
export function linkRatios(tri: Triangle): number[] {
  const maxDev = Math.max(...tri.map((r) => r.length));
  const ratios: number[] = [];
  for (let j = 0; j < maxDev - 1; j += 1) {
    let num = 0;
    let den = 0;
    for (const row of tri) {
      if (row.length > j + 1 && Number.isFinite(row[j]) && Number.isFinite(row[j + 1])) {
        num += row[j + 1];
        den += row[j];
      }
    }
    ratios.push(den === 0 ? 1 : num / den);
  }
  return ratios;
}

/** Cumulative development factor from development year j to ultimate. */
export function cdfFrom(ratios: number[], j: number): number {
  let f = 1;
  for (let k = j; k < ratios.length; k += 1) f *= ratios[k];
  return f;
}

export type ChainLadderResult = {
  ratios: number[];
  ultimates: number[];
  latest: number[];
  reserves: number[];
  totalReserve: number;
};

/** Project each origin year to ultimate by applying the link ratios. */
export function chainLadder(tri: Triangle): ChainLadderResult {
  const ratios = linkRatios(tri);
  const ultimates: number[] = [];
  const latest: number[] = [];
  const reserves: number[] = [];

  tri.forEach((row) => {
    const known = row[row.length - 1];
    const ult = known * cdfFrom(ratios, row.length - 1);
    latest.push(known);
    ultimates.push(ult);
    reserves.push(ult - known);
  });

  return {
    ratios,
    ultimates,
    latest,
    reserves,
    totalReserve: reserves.reduce((a, b) => a + b, 0),
  };
}

/**
 * Bornhuetter-Ferguson ultimate.
 *
 * BF = latest + (1 - 1/CDF) * aPrioriUltimate
 *
 * The point is that it does NOT scale the actual claims up by the CDF. When
 * an immature year has a freakishly small or volatile first payment, chain
 * ladder multiplies that noise by a large factor and explodes; BF instead
 * applies the development pattern to an independent a-priori expectation
 * (premium x expected loss ratio), so an erratic early figure cannot
 * dominate the estimate.
 */
export function bornhuetterFerguson(
  latest: number,
  cdf: number,
  premium: number,
  expectedLossRatio: number,
): number {
  const aPriori = premium * expectedLossRatio;
  const percentDeveloped = 1 / cdf;
  return latest + (1 - percentDeveloped) * aPriori;
}

export function bfReserve(cdf: number, premium: number, expectedLossRatio: number): number {
  return (1 - 1 / cdf) * premium * expectedLossRatio;
}
