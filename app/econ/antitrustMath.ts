// Herfindahl-Hirschman Index and merger screening.
//
// HHI is the sum of squared market shares, measured in percentage points
// (so a monopolist scores 100^2 = 10,000). Squaring is what makes it a
// concentration measure rather than a headcount: it weights large firms
// far more heavily than small ones.

export type Firm = { id: string; name: string; revenue: number };

export type Segment = {
  id: string;
  name: string;
  detail: string;
  /**
   * The segment's constituent firms, not one lump. Modelling a whole segment
   * as a single competitor would inflate HHI and wrongly suggest that adding
   * rivals raises concentration; real segments are fragmented.
   */
  firms: number[];
  /**
   * Cross-price elasticity of demand with the core product. High values mean
   * customers switch to it when the core product's price rises, which is what
   * makes something a substitute and therefore part of the same market.
   */
  crossElasticity: number;
  /** Whether it genuinely belongs in the relevant antitrust market. */
  belongs: boolean;
  why: string;
};

/** Shares in percentage points, given whatever market you defined. */
export function shares(revenues: number[]): number[] {
  const total = revenues.reduce((a, b) => a + b, 0);
  if (total === 0) return revenues.map(() => 0);
  return revenues.map((r) => (r / total) * 100);
}

export function hhi(revenues: number[]): number {
  return shares(revenues).reduce((acc, s) => acc + s * s, 0);
}

/**
 * Post-merger HHI, combining two firms' revenue into one.
 * Merging is purely additive in revenue; the jump in HHI comes from squaring
 * the combined share instead of two smaller ones.
 */
export function hhiAfterMerger(revenues: number[], i: number, j: number): number {
  const merged = revenues.filter((_, k) => k !== i && k !== j);
  merged.push(revenues[i] + revenues[j]);
  return hhi(merged);
}

/**
 * The change in HHI from a merger is exactly 2 * s_i * s_j.
 *
 * (s_i + s_j)^2 - s_i^2 - s_j^2 = 2 * s_i * s_j
 *
 * Every other firm's share is untouched, so the entire delta comes from that
 * one cross term. It is worth knowing cold: it means the delta depends only
 * on the two merging parties, never on how the rest of the market is split.
 */
export function deltaHHI(shareA: number, shareB: number): number {
  return 2 * shareA * shareB;
}

export type Concentration = "unconcentrated" | "moderately" | "highly";

/** 2010 US Horizontal Merger Guidelines bands. */
export function concentrationBand(h: number): Concentration {
  if (h < 1500) return "unconcentrated";
  if (h <= 2500) return "moderately";
  return "highly";
}

export type Verdict = "unlikely" | "scrutiny" | "presumed";

/**
 * Screening presumptions from the Guidelines: a small delta is cleared
 * regardless of concentration, while a large delta in an already-concentrated
 * market is presumed to enhance market power and shifts the burden to the
 * merging parties.
 */
export function screenMerger(postHHI: number, delta: number): Verdict {
  if (delta < 100) return "unlikely";
  const band = concentrationBand(postHHI);
  if (band === "highly" && delta > 200) return "presumed";
  if (band === "unconcentrated") return "unlikely";
  return "scrutiny";
}
