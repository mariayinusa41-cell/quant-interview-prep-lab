// The handoff between finishing a run and the profile's CONTINUE? panel.
//
// sessionStorage, not localStorage: "you just finished a run" is true for
// this tab and this sitting. A record surviving a browser restart would
// greet someone next week with a continue screen for a game they finished
// days ago, which is worse than showing nothing.

const KEY = "outcry_last_run";

/** How long a finished run still counts as "just now". */
export const LAST_RUN_TTL_MS = 30 * 60 * 1000;

export type LastRun = {
  /** Display name, e.g. "Dice EV Lab". */
  game: string;
  /** Route to play it again. */
  href: string;
  score: number;
  /** Best possible score, so the panel can show "18 / 24". Null when the
   *  game has no fixed maximum (the bankroll games). */
  total: number | null;
  at: number;
};

export function recordRun(run: Omit<LastRun, "at">): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ ...run, at: Date.now() }));
  } catch {
    /* private mode — the panel just won't appear */
  }
}

/** The last run, or null if there isn't a recent one. */
export function readLastRun(): LastRun | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastRun;
    if (typeof parsed?.at !== "number" || Date.now() - parsed.at > LAST_RUN_TTL_MS) {
      // Expired records are cleared on read rather than left to accumulate.
      window.sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastRun(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
