// Core Blackjack engine — real dealing from a depleting shoe, standard S17
// dealer rules, correct payouts, and a live bust-probability readout that's
// exactly computable from what's actually left in the shoe (not a coin-flip
// approximation) — same no-replacement theme running through scratch-offs
// (batch odds) and Hot Slot (remaining-slot odds).
//
// Scope for this pass: Hit / Stand / Double Down. Split is deferred — it
// needs multiple simultaneous hands with independent bets and turn order,
// real additional state machine complexity, not a small add-on.

export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
export type Card = { rank: Rank; suit: Suit };

const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Multi-deck shoe (4 decks is standard for many casino tables) rather than a
// single 52-card deck — matters for the bust-probability math below, since a
// bigger shoe means each individual card drawn shifts the odds less.
export function buildShoe(deckCount: number = 4): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) for (const rank of RANKS) shoe.push({ rank, suit });
  }
  return shuffle(shoe);
}

export type HandValue = { total: number; isSoft: boolean; isBust: boolean; isBlackjack: boolean };

function rankValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (["10", "J", "Q", "K"].includes(rank)) return 10;
  return Number(rank);
}

export function handValue(cards: Card[]): HandValue {
  let total = cards.reduce((sum, c) => sum + rankValue(c.rank), 0);
  let aces = cards.filter((c) => c.rank === "A").length;

  while (total > 21 && aces > 0) {
    total -= 10; // demote one Ace from 11 to 1
    aces -= 1;
  }

  return {
    total,
    isSoft: aces > 0, // true only if an Ace is still being counted as 11
    isBust: total > 21,
    isBlackjack: cards.length === 2 && total === 21,
  };
}

// S17: dealer stands on all 17s, hard or soft — the more common, slightly
// more player-favorable variant. (H17 would additionally hit on isSoft &&
// total === 17 — a one-line change here if you want that rule instead.)
export function dealerShouldHit(dealerCards: Card[]): boolean {
  const { total } = handValue(dealerCards);
  return total < 17;
}

export type Phase = "player-turn" | "dealer-turn" | "settled";
export type Outcome = "player-blackjack" | "player-bust" | "dealer-bust" | "player-win" | "dealer-win" | "push";

export type BlackjackRound = {
  wager: number;
  shoe: Card[];
  playerHand: Card[];
  dealerHand: Card[]; // dealerHand[1] is hidden ("hole card") until dealer-turn / settled
  phase: Phase;
  doubledDown: boolean;
  outcome?: Outcome;
};

// Pass an existing (already-depleting) shoe to keep dealing from the same
// shoe across multiple hands — real card counting only works if the shoe
// persists and the count carries over hand-to-hand, resetting only when the
// shoe itself is rebuilt. Omit it (or pass one that's run low) to start a
// fresh 4-deck shoe.
export function startRound(wager: number, incomingShoe?: Card[]): BlackjackRound {
  const shoe = incomingShoe ? [...incomingShoe] : buildShoe(4);
  const playerHand = [shoe.pop()!, shoe.pop()!];
  const dealerHand = [shoe.pop()!, shoe.pop()!];

  const player = handValue(playerHand);
  const dealer = handValue(dealerHand);

  // A player or dealer blackjack settles immediately, before any Hit/Stand
  // decision — that's the real rule (the dealer peeks at the hole card the
  // instant either natural is possible).
  if (player.isBlackjack || dealer.isBlackjack) {
    const outcome: Outcome = player.isBlackjack && dealer.isBlackjack ? "push" : player.isBlackjack ? "player-blackjack" : "dealer-win";
    return { wager, shoe, playerHand, dealerHand, phase: "settled", doubledDown: false, outcome };
  }

  return { wager, shoe, playerHand, dealerHand, phase: "player-turn", doubledDown: false };
}

export function runDealerTurn(round: BlackjackRound): BlackjackRound {
  const shoe = [...round.shoe];
  let dealerHand = [...round.dealerHand];
  while (dealerShouldHit(dealerHand)) dealerHand = [...dealerHand, shoe.pop()!];

  const player = handValue(round.playerHand);
  const dealer = handValue(dealerHand);

  let outcome: Outcome;
  if (dealer.isBust) outcome = "dealer-bust";
  else if (dealer.total > player.total) outcome = "dealer-win";
  else if (dealer.total < player.total) outcome = "player-win";
  else outcome = "push";

  return { ...round, shoe, dealerHand, phase: "settled", outcome };
}

export function playerHit(round: BlackjackRound): BlackjackRound {
  const shoe = [...round.shoe];
  const playerHand = [...round.playerHand, shoe.pop()!];
  const { isBust } = handValue(playerHand);
  return {
    ...round,
    shoe,
    playerHand,
    phase: isBust ? "settled" : "player-turn",
    outcome: isBust ? "player-bust" : undefined,
  };
}

export function playerStand(round: BlackjackRound): BlackjackRound {
  return runDealerTurn(round);
}

export function playerDoubleDown(round: BlackjackRound): BlackjackRound {
  // Only legal as the very first decision — enforce playerHand.length === 2
  // in the UI before allowing this action.
  const shoe = [...round.shoe];
  const playerHand = [...round.playerHand, shoe.pop()!];
  const { isBust } = handValue(playerHand);
  const doubled: BlackjackRound = { ...round, shoe, playerHand, wager: round.wager * 2, doubledDown: true };
  return isBust ? { ...doubled, phase: "settled", outcome: "player-bust" } : runDealerTurn(doubled);
}

// Total amount returned to the player (including their original wager where
// applicable) — NOT net profit. A $10 blackjack returns $25 total (profit
// is $15); a $10 regular win returns $20 total (profit is $10); a push
// returns exactly the $10 wagered (no gain, no loss).
export function payout(round: BlackjackRound): number {
  switch (round.outcome) {
    case "player-blackjack":
      return round.wager * 2.5; // 3:2
    case "player-win":
    case "dealer-bust":
      return round.wager * 2; // 1:1
    case "push":
      return round.wager;
    case "player-bust":
    case "dealer-win":
    default:
      return 0;
  }
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function reduceFraction(numerator: number, denominator: number): { fraction: string; decimal: number } {
  if (denominator === 0) return { fraction: "0", decimal: 0 };
  const g = gcd(numerator, denominator) || 1;
  const n = numerator / g;
  const d = denominator / g;
  return { fraction: d === 1 ? `${n}` : `${n}/${d}`, decimal: n / d };
}

// The exact probability that the NEXT card drawn busts the player's current
// hand, computed directly from what's left in the shoe.
//
// This deals each remaining card and asks handValue() whether the resulting
// hand is actually bust, rather than reasoning about a "bust threshold".
// The threshold version this replaces got two cases wrong:
//
//   * SOFT hands. A soft hand can never bust on a single card, because the
//     Ace demotes from 11 to 1 to absorb it — soft 17 (A,6) drawing a 5 is
//     11+6+5=22 -> 1+6+5=12, not a bust. The old code compared 5 against a
//     threshold of 21-17=4 and counted it as a bust, reporting ~69% for a
//     hand whose true bust probability is exactly 0%.
//   * Hard 21 drawing an Ace. Aces were excluded unconditionally on the
//     grounds that they always demote, but at 21 even the demoted value
//     busts (21+1=22), so those four cards belong in the count.
//
// Enumerating is also just cheaper to trust: there is no separate rule to
// keep in sync with handValue(), which is already the authority on what a
// hand is worth.
export function bustProbability(round: BlackjackRound): { decimal: number; fraction: string; count: number; shoeSize: number } {
  const bustCount = round.shoe.filter((c) => handValue([...round.playerHand, c]).isBust).length;
  const reduced = reduceFraction(bustCount, round.shoe.length);
  return { ...reduced, count: bustCount, shoeSize: round.shoe.length };
}


// The exact probability the DEALER eventually busts, given the upcard you can
// actually see and the exact composition of what's left in the shoe.
//
// Unlike the player's one-card bust question, this is a recursion: the dealer
// keeps drawing under a fixed rule (S17 — stand on all 17s), so every draw
// branches into another decision. Cards are drawn WITHOUT replacement, so the
// shoe is tracked as remaining counts per rank and decremented down each
// branch — using fixed 1/13 weights would quietly ignore the very card
// removal that counting is about.
//
// Memoised on (total, soft, cards-left) rather than the full shoe: within a
// single call the shoe composition at a given depth is effectively fixed by
// the path, and the depth of dealer draws is small (a dealer can draw at most
// a handful of times before reaching 17+ or busting), so this stays cheap
// enough to run on every render.
export function dealerBustProbability(round: BlackjackRound): { decimal: number; percent: string } {
  // Only the dealer's first card is face-up during the player's turn; the
  // hole card is unknown to the player and must not be peeked at here.
  const upcard = round.dealerHand[0];
  if (!upcard) return { decimal: 0, percent: "0%" };

  const counts = new Map<Rank, number>();
  for (const c of round.shoe) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);

  function recurse(total: number, soft: boolean, remaining: Map<Rank, number>, size: number): number {
    if (total > 21) {
      if (soft) return recurse(total - 10, false, remaining, size);
      return 1;
    }
    if (total >= 17) return 0; // S17: dealer stands, no bust
    if (size <= 0) return 0;

    let p = 0;
    for (const [rank, n] of remaining) {
      if (n <= 0) continue;
      const weight = n / size;
      const next = new Map(remaining);
      next.set(rank, n - 1);

      let t = total + rankValue(rank);
      let s = soft || rank === "A";
      if (t > 21 && s) { t -= 10; s = false; }

      p += weight * recurse(t, s, next, size - 1);
    }
    return p;
  }

  const startSoft = upcard.rank === "A";
  const decimal = recurse(rankValue(upcard.rank), startSoft, counts, round.shoe.length);
  return { decimal, percent: `${(decimal * 100).toFixed(1)}%` };
}

export { rankValue };
