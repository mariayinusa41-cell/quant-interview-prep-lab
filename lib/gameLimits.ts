// Server-side plausibility limits for submitted scores.
//
// WHAT THIS DOES AND DOES NOT DO
//
// Scores are computed in the browser, so the endpoint cannot verify that a
// run happened as claimed. Truly authoritative scoring would mean generating
// the questions server-side and replaying the answers there, which is a
// different architecture, not a patch.
//
// What this closes is the realistic attack: posting an arbitrary number.
// Every board has a known maximum — Fermi Classic is 10 questions worth 4
// points each, so 40 is the ceiling and 41 is provably fake. Combined with
// a per-hour submission cap and a minimum run duration, a cheater is reduced
// to claiming a score a strong human could actually have scored, at a rate a
// human could actually play. That is a far narrower hole than "type any
// number", and it is the honest limit of what client-reported scores allow.
//
// An unknown gameId is rejected outright, so nobody can invent boards.
//
// Each ceiling below is derived from the game's own constants. If you change
// a round count or a points-per-question, change it here too — a cap set too
// low silently rejects a legitimate top score.

export type GameLimit = {
  /** Highest score the game can actually award. Inclusive. */
  maxScore: number;
  /**
   * Lowest recordable score. Defaults to 0 for points games, but the
   * bankroll games rank on PROFIT, which is legitimately negative when a
   * session loses money — refusing negatives there would quietly drop every
   * losing run instead of ranking it.
   */
  minScore?: number;
  /** Shortest plausible run, in ms. Submissions faster than this are junk. */
  minDurationMs?: number;
  label: string;
  /** Shown on the board so a profit column is not mistaken for points. */
  unit?: "points" | "dollars";
};

export const GAME_LIMITS: Record<string, GameLimit> = {
  // ROUND_COUNT (10) x 4 points per interval question.
  "drills-fermi-classic": { maxScore: 40, label: "Fermi Estimation" },
  // TECH_ROUND_COUNT (8) x 3 points per technical interval question.
  "drills-fermi-technical": { maxScore: 24, label: "Technical Estimation" },
  // ROUND_COUNT (8) x 3 points per ranking.
  "drills-probability-ranking": { maxScore: 24, label: "Likelihood Ranking" },
  // ROUND_COUNT (10) x 3 points per EV question.
  "probability-casino-dice-ev-lab": { maxScore: 30, label: "Dice EV Lab" },
  // 5 cases x (80 base + 50 moment + 40 speed + 30 data) + 150 CLT round.
  "statistics-read-the-shape": { maxScore: 1150, label: "Read the Shape" },
  // 4 levels x 250 for correctly funding the one real edge.
  "statistics-twenty-backtests": { maxScore: 1000, label: "Twenty Backtests" },
  // 5 cases x (100 base + 50 speed + 40 data + PREDICTIONS(3) x 10 hits).
  "statistics-crack-the-bot": { maxScore: 1100, label: "Crack the Bot" },

  // --- Bankroll games: ranked on PROFIT, not final chips ---
  //
  // Profit is the fair comparison because every player starts with the same
  // $100. Ranking final chips would just reward whoever staked biggest,
  // which measures appetite rather than judgement.
  //
  // These ceilings are deliberately looser than the points games above.
  // A points game has an exact maximum; a bankroll game does not — a hot
  // run can compound. So the cap's job here is to reject nonsense (1e9),
  // not to pin the exact best-possible session. The numbers below sit well
  // clear of simulated extremes so a genuinely lucky run is never refused.
  //
  // Ruin Walker: 40k simulated runs per loading gave a net surplus between
  // -82 and +119; at the $10 max stake that is roughly -820 to +1190.
  "stochastic-ruin-walker": {
    minScore: -5000, maxScore: 5000, label: "Ruin Walker", unit: "dollars",
  },
  // Market Maker: 10 rounds of tick P&L at up to $50 per tick.
  "finance-market-maker": {
    minScore: -30000, maxScore: 30000, label: "Market Maker", unit: "dollars",
  },
};

/** How many runs one player may record per game per hour. */
export const MAX_SUBMISSIONS_PER_HOUR = 30;

export function getGameLimit(gameId: string): GameLimit | null {
  return GAME_LIMITS[gameId] ?? null;
}
