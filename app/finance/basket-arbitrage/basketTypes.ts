// Basket Arbitrage — the "two cards, balance your inventory" screen game.
//
// Each card is a tradeable basket: a composition of underlying commodities,
// plus a bid (what you're paid to sell one) and an ask (what you pay to buy
// one). Some cards are single units, some are bundles. The task each round
// is the same one real multi-leg market-making screens ask: find a
// combination of buys and sells across the cards that (a) nets every
// commodity's inventory to exactly zero and (b) locks in positive cash —
// pure arbitrage, no directional risk.

export type CommodityType = "gold" | "silver" | "platinum" | "copper" | "oil";

export const COMMODITY_NAMES: Record<CommodityType, string> = {
  gold: "Gold",
  silver: "Silver",
  platinum: "Platinum",
  copper: "Copper",
  oil: "Oil",
};

export type BasketCard = {
  id: string;
  name: string;
  composition: Partial<Record<CommodityType, number>>;
  bid: number; // price you receive selling one unit of this card
  ask: number; // price you pay buying one unit of this card
};

export type LevelPuzzle = {
  id: string;
  level: number;
  title: string;
  description: string;
  timeLimitSec: number;
  cards: BasketCard[];
  /** One verified hedge that balances inventory with positive PnL — used
   *  only for the post-round explanation, not enforced as "the" answer;
   *  any balanced, positive-PnL combination the player finds counts. */
  solution: { actions: Record<string, number>; pnl: number };
  explanation: string;
};
