// Difference-in-Differences.
//
// The estimator is the difference of two differences: how the treated group
// moved, minus how the untreated control moved over the same window. The
// control's movement is the counterfactual — what the treated group would
// have done anyway.
//
//   DiD = (T_post - T_pre) - (C_post - C_pre)
//
// Two things fall out of that subtraction automatically, and candidates are
// routinely tested on both:
//   * a FIXED level gap between the groups cancels (it is in T_pre and T_post
//     equally), so "the regions were never identical" is not itself a problem;
//   * a shock hitting BOTH groups equally cancels, since it lands in the
//     control difference too.
// What does NOT cancel is a shock hitting only the treated group inside the
// post window. That is exactly a parallel-trends violation, and it is the
// bias every opposing expert will hunt for.

export type Cell = { pre: number; post: number };

export function groupChange(c: Cell): number {
  return c.post - c.pre;
}

export function did(treated: Cell, control: Cell): number {
  return groupChange(treated) - groupChange(control);
}

/**
 * Removes a shock known to have hit only the treated group in the post
 * period, recovering the causal effect attributable to the treatment.
 */
export function adjustedDid(treated: Cell, control: Cell, treatedOnlyPostShock: number): number {
  return did(treated, control) - treatedOnlyPostShock;
}

/**
 * Parallel-trends pre-check. DiD is only credible if the two groups were
 * moving together BEFORE treatment; this compares their pre-period slopes.
 */
export function preTrendGap(treatedPre: number[], controlPre: number[]): number {
  const slope = (xs: number[]) => (xs.length < 2 ? 0 : (xs[xs.length - 1] - xs[0]) / (xs.length - 1));
  return slope(treatedPre) - slope(controlPre);
}

export type Confounder = {
  id: string;
  label: string;
  detail: string;
  /** Does it bias DiD? Only treated-group, post-period shocks do. */
  biases: boolean;
  why: string;
};
