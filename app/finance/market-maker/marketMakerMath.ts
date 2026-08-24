// Core math for the market-maker game. A single "fair value" random-walks
// one tick at a time. Each round you quote a half-spread AND a skew (shift
// both sides up or down) around it; a hidden "truth" for the round —
// generated before you act — decides whether flow this round is informed
// (already knows which way price is about to move) or noise, and which
// side it would trade. You sometimes get a noisy signal about that truth
// before you quote; reading it and skewing correctly is the actual skill.
// Inventory carries across rounds and is marked to market every round —
// closing it out at the end costs a small crossing fee per unit, same as a
// real market maker paying the spread to flatten. Same gcd/reduceFraction
// helper pattern used by the other casino games.

export const HALF_SPREAD_OPTIONS = [1, 2, 3, 4];
export const SKEW_OPTIONS = [-2, -1, 0, 1, 2];
export const P_INFORMED = 0.35; // fraction of rounds that are informed flow
export const INFORMED_MOVE = 2; // ticks price moves (in the informed side's favor) on informed flow
export const NOISE_MOVE_MAG = 1; // ticks the background walk moves on noise flow
export const SIGNAL_DETECTION_PROB = 0.55; // chance an informed round tips its hand with a signal
export const FLATTEN_COST_PER_UNIT = 0.5; // ticks paid per unit of inventory closed out at session end

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function reduceFraction(numerator: number, denominator: number) {
  const g = gcd(Math.abs(numerator), Math.abs(denominator)) || 1;
  return { n: numerator / g, d: denominator / g, display: `${numerator / g}/${denominator / g}` };
}

// Wider spreads scare off less-motivated counterparties — every extra tick
// of half-spread costs 20 points of fill probability, floored at 20%. Skew
// shifts price, not width, so it doesn't affect this.
export function fillProbability(half: number): number {
  return Math.max(0.2, 1 - (half - 1) * 0.2);
}

export function evPerFill(half: number, skew = 0): number {
  return half + skew - P_INFORMED * INFORMED_MOVE;
}

export function evPerRound(half: number, skew = 0): number {
  return fillProbability(half) * evPerFill(half, skew);
}

export function breakevenHalfSpread(): number {
  return P_INFORMED * INFORMED_MOVE;
}

export type RoundTruth = {
  informed: boolean;
  side: "buy" | "sell"; // the direction flow would trade this round, if it trades at all
  move: number; // signed tick change to fair value this round, regardless of whether you got filled
  signal: "buy" | "sell" | null; // what you're shown before quoting — null means no tell this round
};

// Decided once, before the player quotes, so the signal can genuinely
// inform the skew decision instead of just narrating a coin flip after the
// fact.
export function generateRoundTruth(): RoundTruth {
  const informed = Math.random() < P_INFORMED;
  const side: "buy" | "sell" = Math.random() < 0.5 ? "buy" : "sell";
  const move = informed
    ? side === "buy"
      ? INFORMED_MOVE
      : -INFORMED_MOVE
    : Math.random() < 0.5
      ? -NOISE_MOVE_MAG
      : NOISE_MOVE_MAG;
  const signal = informed && Math.random() < SIGNAL_DETECTION_PROB ? side : null;
  return { informed, side, move, signal };
}

export type QuoteResult = {
  filled: boolean;
  side: "buy" | "sell" | null; // counterparty's action, if filled
  fillPrice: number | null; // absolute price they traded at
  inventoryDelta: number; // your position change: +1 bought, -1 sold, 0 no fill
  cashDelta: number; // your cash change from the trade (absolute price units)
};

// half/skew are the player's choice; fair is the price right now; truth is
// this round's pre-generated hidden outcome.
export function resolveQuote(half: number, skew: number, fair: number, truth: RoundTruth): QuoteResult {
  const filled = Math.random() < fillProbability(half);
  if (!filled) {
    return { filled: false, side: null, fillPrice: null, inventoryDelta: 0, cashDelta: 0 };
  }

  if (truth.side === "buy") {
    // Counterparty lifts your ask — you sell.
    const ask = fair + half + skew;
    return { filled: true, side: "buy", fillPrice: ask, inventoryDelta: -1, cashDelta: ask };
  }

  // Counterparty hits your bid — you buy.
  const bid = fair - half + skew;
  return { filled: true, side: "sell", fillPrice: bid, inventoryDelta: 1, cashDelta: -bid };
}

// Mark-to-market P&L at any point: realized cash plus the current value of
// whatever inventory you're still holding.
export function markToMarket(cash: number, inventory: number, fair: number): number {
  return cash + inventory * fair;
}

// Closing out remaining inventory at session end costs a crossing fee per
// unit — you don't get to flatten for free, same as paying the spread to
// trade out in a real book.
export function flattenCost(inventory: number): number {
  return Math.abs(inventory) * FLATTEN_COST_PER_UNIT;
}
