// Life contingencies for annuity pricing.
//
//   q_x   probability someone aged x dies before x+1
//   p_x   probability they survive the year  = 1 - q_x
//   kp_x  probability they survive k whole years = p_x * p_{x+1} * ... * p_{x+k-1}
//
// kp_x compounds, which is why a small improvement in annual mortality moves
// a long-dated annuity so much more than intuition suggests.

export type MortalityTable = { startAge: number; q: number[] };

export function survivalOneYear(q: number): number {
  return 1 - q;
}

/** kp_x — survive k whole years from the table's start age. */
export function kSurvival(table: MortalityTable, k: number): number {
  let p = 1;
  for (let i = 0; i < k; i += 1) p *= survivalOneYear(table.q[i]);
  return p;
}

/** Discount factor v^k for an annual effective interest rate i. */
export function discount(rate: number, k: number): number {
  return 1 / Math.pow(1 + rate, k);
}

/** Expected present value of one payment due at time k. */
export function expectedPayment(table: MortalityTable, rate: number, k: number, amount = 1): number {
  return amount * discount(rate, k) * kSurvival(table, k);
}

/**
 * EPV of an n-year temporary annuity-DUE: payments at the start of each year,
 * so the sum runs k = 0 .. n-1 and the first payment is certain (v^0 * 0p_x = 1).
 *
 *   a-due = sum_{k=0}^{n-1} v^k * kp_x
 */
export function annuityDue(table: MortalityTable, rate: number, n: number, amount = 1): number {
  let total = 0;
  for (let k = 0; k < n; k += 1) total += expectedPayment(table, rate, k, amount);
  return total;
}

/**
 * Longevity improvement: every q_x scaled by `factor` (< 1 means people live
 * longer). This is the risk an annuity writer is short — improving mortality
 * raises the liability.
 */
export function improveMortality(table: MortalityTable, factor: number): MortalityTable {
  return { startAge: table.startAge, q: table.q.map((x) => x * factor) };
}
