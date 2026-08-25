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
  /** Shortest plausible run, in ms. Submissions faster than this are junk. */
  minDurationMs?: number;
  label: string;
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
};

/** How many runs one player may record per game per hour. */
export const MAX_SUBMISSIONS_PER_HOUR = 30;

export function getGameLimit(gameId: string): GameLimit | null {
  return GAME_LIMITS[gameId] ?? null;
}
