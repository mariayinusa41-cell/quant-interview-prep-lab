// Hi-Lo card counting. A real count only includes cards you've actually
// seen — the dealer's hole card is dealt face-down and must NOT contribute
// to the count until it's flipped face-up during the dealer's turn. The
// game component is responsible for deferring that update accordingly.

import type { Card, Rank } from "./blackjackMath";

export function hiLoValue(rank: Rank): number {
  if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
  if (["7", "8", "9"].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}

export type CountState = {
  runningCount: number;
  cardsSeen: number;
};

export function updateCount(state: CountState, card: Card): CountState {
  return { runningCount: state.runningCount + hiLoValue(card.rank), cardsSeen: state.cardsSeen + 1 };
}

export function trueCount(state: CountState, shoe: Card[]): number {
  const decksRemaining = Math.max(0.5, shoe.length / 52); // floor at half a deck to avoid a divide-by-near-zero spike late in the shoe
  return state.runningCount / decksRemaining;
}

export function resetCount(): CountState {
  return { runningCount: 0, cardsSeen: 0 };
}
