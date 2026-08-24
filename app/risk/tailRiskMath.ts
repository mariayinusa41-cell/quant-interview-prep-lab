// Value at Risk, Expected Shortfall, and what correlation breakdown does to
// a portfolio.

/** Standard normal pdf. */
export function normPDF(z: number): number {
  return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
}

/**
 * Inverse standard normal CDF (Acklam's rational approximation).
 * Accurate to ~1e-9 across the range, which is far more than a risk display
 * needs but keeps the quantiles exact enough to check by hand.
 */
export function normInv(p: number): number {
  if (p <= 0 || p >= 1) return NaN;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
             1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
             6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
             -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
             3.754408661907416];
  const pLow = 0.02425;
  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
           ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
  if (p <= 1 - pLow) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
          ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

export type Asset = { id: string; name: string; weight: number; vol: number };

/**
 * Portfolio volatility from weights, vols and a correlation matrix:
 *   sigma_p^2 = sum_i sum_j w_i w_j sigma_i sigma_j rho_ij
 */
export function portfolioVol(assets: Asset[], corr: number[][]): number {
  let variance = 0;
  for (let i = 0; i < assets.length; i += 1) {
    for (let j = 0; j < assets.length; j += 1) {
      variance += assets[i].weight * assets[j].weight * assets[i].vol * assets[j].vol * corr[i][j];
    }
  }
  return Math.sqrt(variance);
}

/**
 * Correlation matrix with every off-diagonal set to rho. Setting rho = 1
 * models the crisis case where everything sells off together — and there the
 * portfolio vol collapses to the plain weighted sum of the asset vols,
 * because diversification has stopped existing.
 */
export function uniformCorr(n: number, rho: number): number[][] {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : rho)),
  );
}

/** Parametric (normal) VaR as a positive loss fraction, zero-mean. */
export function normalVaR(vol: number, confidence: number): number {
  return normInv(confidence) * vol;
}

/**
 * Normal Expected Shortfall: the average loss GIVEN the loss already exceeded
 * VaR.  ES = sigma * phi(z_alpha) / (1 - alpha).
 *
 * ES is always at least VaR, and unlike VaR it is subadditive — merging two
 * books can never make ES look better than the sum of its parts, which is why
 * regulators moved to it.
 */
export function normalES(vol: number, confidence: number): number {
  const z = normInv(confidence);
  return (vol * normPDF(z)) / (1 - confidence);
}

/** Empirical VaR/ES from a loss sample (losses positive). */
export function empiricalTail(losses: number[], confidence: number) {
  const sorted = [...losses].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(confidence * sorted.length));
  const varLevel = sorted[idx];
  const tail = sorted.slice(idx);
  const es = tail.reduce((a, b) => a + b, 0) / Math.max(1, tail.length);
  return { varLevel, es };
}
