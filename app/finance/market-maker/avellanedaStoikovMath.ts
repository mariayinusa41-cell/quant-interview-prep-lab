// Avellaneda & Stoikov (2008), "High-frequency trading in a limit order
// book" — the actual closed-form optimal market-making model, not a
// discrete heuristic menu. Every round you compute:
//
//   reservation price  r(s,q,t) = s − q·γ·σ²·(T−t)
//   optimal spread     δ = γ·σ²·(T−t) + (2/γ)·ln(1 + γ/κ)
//   bid = r − δ/2,  ask = r + δ/2
//
// r is where you'd theoretically be indifferent to buying or selling given
// your current inventory — flat (q=0) gives r=s exactly. Carrying inventory
// pulls r away from fair in the direction that makes the position easier to
// unwind: long skews r down (you want to sell), short skews it up. That
// skew is *exactly* this game's old manual "skew" control, just computed
// instead of guessed. δ shrinks as the session's time-to-horizon (T−t)
// shrinks — less time left means less inventory risk to price in — but
// never below the flat (2/γ)ln(1+γ/κ) floor, since that term compensates
// for adverse selection/execution risk, not inventory risk, and doesn't
// care what time it is.
//
// Every property below (flat ⇒ r=s, long ⇒ r<s, short ⇒ r>s, symmetric,
// higher γ ⇒ wider spread and steeper skew, spread → floor not zero as
// t→T) was checked against the formula in Node before this shipped.

export const GAMMA = 1; // risk aversion — higher means more averse to holding inventory
export const SIGMA = 1.5; // per-round volatility of the fair-value random walk, in ticks
export const KAPPA = 1; // order-flow intensity / liquidity — lower means thinner book, wider floor spread
export const T = 1; // normalized session length

export function reservationPrice(s: number, q: number, t: number, gamma = GAMMA, sigma = SIGMA): number {
  return s - q * gamma * sigma * sigma * (T - t);
}

export function optimalSpread(t: number, gamma = GAMMA, sigma = SIGMA, kappa = KAPPA): number {
  return gamma * sigma * sigma * (T - t) + (2 / gamma) * Math.log(1 + gamma / kappa);
}

export type ASQuote = { r: number; spread: number; half: number; skew: number; bid: number; ask: number };

/** Everything needed to quote this round, in one place — `skew` here is r
 *  minus fair, i.e. the same quantity the game's older manual "skew"
 *  control represented, now derived instead of chosen. */
export function computeQuote(fair: number, inventory: number, round: number, rounds: number): ASQuote {
  const t = round / rounds;
  const r = reservationPrice(fair, inventory, t);
  const spread = optimalSpread(t);
  const half = spread / 2;
  const skew = r - fair;
  return { r, spread, half, skew, bid: r - half, ask: r + half };
}
