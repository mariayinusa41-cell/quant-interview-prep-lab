"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AccessMode = "developer" | "free" | "infinity";

export const STARTING_TOKENS = 100;
export const SESSION_COST = 10;
export const SESSION_ROUNDS = 3;

type AccessContextValue = {
  mode: AccessMode;
  tokens: number;
  gameSessions: Record<string, number>;
  setMode: (mode: AccessMode) => void;
  getRoundsRemaining: (gameId: string) => number;
  isFreeGame: (gameId: string) => boolean;
  isPremiumOnly: (gameId: string) => boolean;
  getSessionCost: (gameId: string) => number;
  getLifetimeCap: (gameId: string) => number | null;
  getLifetimeUses: (gameId: string) => number;
  isLifetimeExhausted: (gameId: string) => boolean;
  // Human label for the shared pool a game's lifetime cap belongs to (e.g.
  // "Brain Teasers"), or null for a game that caps on its own.
  getLifetimeGroupLabel: (gameId: string) => string | null;
  grantTokens: (amount: number) => void;
  startGameEntry: (gameId: string) => boolean;
};

const MODE_KEY = "quant_access_mode";
const TOKENS_KEY = "quant_access_tokens";
const SESSIONS_KEY = "quant_game_sessions";
// How many times each lifetime-capped game has had a brand-new paid session
// started, ever — separate from SESSIONS_KEY, which only tracks rounds left
// on the CURRENT session and resets to 0 once a session is used up.
const LIFETIME_KEY = "quant_game_lifetime_uses";
const FREE_GAME_IDS = new Set([
  "drills-arithmetic",
  "drills-sequence-sprint",
  "finance-delta-defender",
  "brain-screwy-pirates",
  "algorithms-mini-rookie-01",
  "algorithms-mini-novice-01",
  "algorithms-mini-intermediate-01",
]);

const PREMIUM_ONLY_GAME_IDS = new Set([
  "algorithms-dp-table-builder",
  "algorithms-monte-carlo-estimator",
  "algorithms-speed-round",
  "algorithms-mini-rookie",
  "algorithms-mini-novice",
  "algorithms-mini-intermediate",
  "algorithms-mini-advanced",
  "algorithms-mini-advanced-01",
  // The 11 individual brain teasers used to live here as Infinity-Pass-only.
  // They moved to GAME_COSTS (15 tokens) with a lifetime cap of 1 instead —
  // a free user can unlock and play any teaser of their choice once, ever,
  // then it's pass-only. See LIFETIME_CAP_GAME_IDS below.
  //
  // Calculus/Linear Algebra ("gradient") lab: only Newton Stepper stays
  // purchasable with tokens; the rest now require the unlimited pass.
  "calculus-eigenvector-spotter",
  "calculus-lagrange-optimizer",
  "calculus-taylor-slider",
  "calculus-psd-classifier",
  "statistics-twenty-backtests",
  "stochastic-martingale-mutiny",
  "probability-pick-3",
  "probability-pick-4",
  "probability-pick-5",
  "probability-casino-blackjack",
  "probability-scratch-timed-13",
  "probability-scratch-untimed-13",
  "finance-market-maker",
  "finance-basket-arbitrage",
  // Drill Lab: Arithmetic and Sequence Sprint stay free forever. Fermi is
  // split into two ids by mode (FermiGame.tsx renders one or the other
  // depending on which tab is active) — Classic is a normal token game,
  // Technical (the assessment-style dice-board/grid-path drill) is the
  // pass-gated upgrade.
  "drills-fermi-technical",
  // Duck-at-the-crossroad task-switching drill and the x/y-plot ranking
  // drill are both Infinity-Pass-only.
  "drills-duck-intersection",
  "drills-probability-ranking",
  // Causal Confounder (regression + omitted-variable-bias) is Infinity-Pass-
  // only. Antitrust and Crack the Bot stay token-purchasable but each caps
  // at one lifetime play for a free user — see LIFETIME_CAP_GAME_IDS.
  "econ-causal-confounder",
]);

// Games a free user can buy with tokens like normal, but only ONCE ever —
// after that single lifetime session the game becomes Infinity-Pass-only,
// same as anything in PREMIUM_ONLY_GAME_IDS. Distinct from PREMIUM_ONLY
// because the FIRST play is still a real token purchase with real session
// rounds, not a blanket lock from the start.
//
// Buying an existing session's remaining rounds does not count against this
// — only starting a brand-new paid session consumes one lifetime use, so a
// free user always gets the full SESSION_ROUNDS-round session once, not
// just a single round.
//
// Each entry here is a game that caps on ITS OWN lifetime use count (e.g.
// Antitrust caps independently of Crack the Bot). Brain teasers are NOT
// listed here — they share one cap across the whole category, defined
// below in LIFETIME_GROUPS, since each teaser's answer is a one-time
// reveal: a free user picks ONE teaser of their choice to unlock, and
// every other teaser (not just that one) becomes Infinity-Pass-only the
// moment they do, rather than each of the 11 being independently
// re-unlockable for 15 tokens apiece.
const LIFETIME_CAP_GAME_IDS: Record<string, number> = {
  "econ-antitrust": 1,
  "statistics-crack-the-bot": 1,
};

const BRAIN_TEASER_GAME_IDS = [
  "brain-tiger-and-sheep",
  "brain-the-split-deal",
  "brain-stag-or-hare",
  "brain-one-offer,-no-discussion",
  "brain-the-growing-pot",
  "brain-two-thirds-of-the-room",
  "brain-one-seat-in-the-boat",
  "brain-the-office-bet",
  "brain-the-third-door",
  "brain-the-line-of-hats",
  "brain-the-rope-bridge",
];

// A shared lifetime cap across a whole set of games: using the cap on ANY
// member locks every OTHER member too, not just the one played. The counter
// is stored under the group's own key (not any individual gameId).
const LIFETIME_GROUPS: Record<string, { members: string[]; cap: number; label: string }> = {
  "brain-teasers": { members: BRAIN_TEASER_GAME_IDS, cap: 1, label: "Brain Teasers" },
};

function groupKeyFor(gameId: string): string | null {
  for (const [key, group] of Object.entries(LIFETIME_GROUPS)) {
    if (group.members.includes(gameId)) return key;
  }
  return null;
}

// Per-game token price overrides. Anything not listed here costs the
// default SESSION_COST (10 tokens) per SESSION_ROUNDS-round session.
// Everything token-purchasable is priced at double its old rate except
// Read the Shape, which stays at the base 10 — the intended "free preview"
// game for Statistics.
const GAME_COSTS: Record<string, number> = {
  "statistics-crack-the-bot": 40, // one lifetime play as a free user, see LIFETIME_CAP_GAME_IDS
  "stochastic-ruin-walker": 30,
  "calculus-newton-stepper": 30,
  "probability-casino-russian-roulette": 20,
  "probability-scratch-timed-7": 20,
  "probability-scratch-untimed-7": 20,
  "actuarial-loss-triangle": 30,
  // econ-causal-confounder removed: it's Infinity-Pass-only now (see
  // PREMIUM_ONLY_GAME_IDS), so a token price for it is dead config.
  "econ-antitrust": 30, // one lifetime play as a free user, see LIFETIME_CAP_GAME_IDS
  "risk-tail-stress": 30,
  "quantdev-order-book": 30,
  "quantdev-concurrency": 30,
  "actuarial-survival-run": 30,
  // Drill Lab's Survival Run (the dino-sprite mental-math runner at
  // /drills/survival — a different game from Actuarial's Survival Run
  // above). No price was ever specified for it; left at the site default
  // (10) rather than guessed at a different number.
  "drills-survival-run": 10,
  // Classic Fermi. No explicit price was ever wired in before this — the
  // whole Fermi id was Infinity-Pass-only — so this is a genuinely new
  // price, set at the site default rather than guessed higher.
  "drills-fermi-classic": 10,
  // The 11 individual brain teasers (Tiger and Sheep, The Split Deal, Stag
  // or Hare, One Offer No Discussion, The Growing Pot, Two-Thirds of the
  // Room, One Seat in the Boat, The Office Bet, The Third Door, The Line of
  // Hats, The Rope Bridge). Each is a one-lifetime-play unlock for a free
  // user — see LIFETIME_CAP_GAME_IDS.
  "brain-tiger-and-sheep": 15,
  "brain-the-split-deal": 15,
  "brain-stag-or-hare": 15,
  "brain-one-offer,-no-discussion": 15,
  "brain-the-growing-pot": 15,
  "brain-two-thirds-of-the-room": 15,
  "brain-one-seat-in-the-boat": 15,
  "brain-the-office-bet": 15,
  "brain-the-third-door": 15,
  "brain-the-line-of-hats": 15,
  "brain-the-rope-bridge": 15,
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AccessMode>("developer");
  const [tokens, setTokens] = useState(STARTING_TOKENS);
  const [gameSessions, setGameSessions] = useState<Record<string, number>>({});
  const [lifetimeUses, setLifetimeUses] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedMode = window.localStorage.getItem(MODE_KEY);
    const savedTokensRaw = window.localStorage.getItem(TOKENS_KEY);
    const savedSessions = window.localStorage.getItem(SESSIONS_KEY);
    const savedLifetime = window.localStorage.getItem(LIFETIME_KEY);

    if (savedMode === "developer" || savedMode === "free" || savedMode === "infinity") {
      setModeState(savedMode);
    }

    let currentTokens = STARTING_TOKENS;
    const savedTokens = Number(savedTokensRaw);
    if (savedTokensRaw !== null && Number.isFinite(savedTokens) && savedTokens >= 0) {
      currentTokens = savedTokens;
    }

    setTokens(currentTokens);
    window.localStorage.setItem(TOKENS_KEY, String(currentTokens));

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions) as Record<string, unknown>;
        const clean = Object.fromEntries(
          Object.entries(parsed)
            .filter(([, value]) => typeof value === "number" && value > 0)
            .map(([key, value]) => [key, Math.min(Number(value), SESSION_ROUNDS - 1)]),
        );
        setGameSessions(clean);
      } catch {
        setGameSessions({});
      }
    }

    if (savedLifetime) {
      try {
        const parsed = JSON.parse(savedLifetime) as Record<string, unknown>;
        const clean = Object.fromEntries(
          Object.entries(parsed).filter(([, value]) => typeof value === "number" && value > 0),
        ) as Record<string, number>;
        setLifetimeUses(clean);
      } catch {
        setLifetimeUses({});
      }
    }
  }, []);

  const setMode = (nextMode: AccessMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(MODE_KEY, nextMode);
    // The homepage is a product-mode preview, so entering Free mode starts a
    // clean example account instead of carrying state from another preview.
    if (nextMode === "free" && mode !== "free") {
      window.localStorage.setItem(TOKENS_KEY, String(STARTING_TOKENS));
      window.localStorage.setItem(SESSIONS_KEY, "{}");
      window.localStorage.setItem(LIFETIME_KEY, "{}");
      setTokens(STARTING_TOKENS);
      setGameSessions({});
      setLifetimeUses({});
    }
  };

  const getRoundsRemaining = (gameId: string) => gameSessions[gameId] ?? 0;
  const isFreeGame = (gameId: string) => FREE_GAME_IDS.has(gameId);
  const isPremiumOnly = (gameId: string) => PREMIUM_ONLY_GAME_IDS.has(gameId);
  const getSessionCost = (gameId: string) => GAME_COSTS[gameId] ?? SESSION_COST;
  // A grouped game's cap/uses come from its group's shared counter; an
  // ungrouped one uses its own id directly. Either way the caller doesn't
  // need to know which — same as PREMIUM_ONLY reads either way.
  const getLifetimeCap = (gameId: string) => {
    const groupKey = groupKeyFor(gameId);
    if (groupKey) return LIFETIME_GROUPS[groupKey].cap;
    return LIFETIME_CAP_GAME_IDS[gameId] ?? null;
  };
  const getLifetimeUses = (gameId: string) => {
    const groupKey = groupKeyFor(gameId);
    return lifetimeUses[groupKey ?? gameId] ?? 0;
  };
  // Exhausted only matters once THIS SPECIFIC game has no active session
  // left to finish — someone mid-session on their one lifetime play still
  // gets every round of the one teaser they actually bought. But the CAP
  // itself is shared: once a grouped game's counter is used up, every
  // sibling reads exhausted too, even one that was never individually
  // purchased.
  const isLifetimeExhausted = (gameId: string) => {
    const cap = getLifetimeCap(gameId);
    if (cap === null) return false;
    return getRoundsRemaining(gameId) === 0 && getLifetimeUses(gameId) >= cap;
  };
  const getLifetimeGroupLabel = (gameId: string) => {
    const groupKey = groupKeyFor(gameId);
    return groupKey ? LIFETIME_GROUPS[groupKey].label : null;
  };

  // Earned, never passive: the daily challenge and the 7-day wheel are the
  // only callers.
  const grantTokens = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setTokens((prev) => {
      const next = prev + amount;
      try {
        window.localStorage.setItem(TOKENS_KEY, String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const startGameEntry = (gameId: string) => {
    if (mode !== "free" || isFreeGame(gameId)) return true;
    if (isPremiumOnly(gameId)) return false;

    const currentRounds = getRoundsRemaining(gameId);
    if (currentRounds > 0) {
      const nextRounds = currentRounds - 1;
      const nextSessions = { ...gameSessions, [gameId]: nextRounds };
      setGameSessions(nextSessions);
      window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));
      return true;
    }

    // No active session left, so this would start a brand-new one — the
    // lifetime cap (if this game has one, or shares one with a group)
    // applies right here, before any tokens change hands.
    const cap = getLifetimeCap(gameId);
    if (cap !== null && getLifetimeUses(gameId) >= cap) return false;

    const cost = getSessionCost(gameId);
    if (tokens < cost) return false;

    const nextTokens = tokens - cost;
    const nextSessions = { ...gameSessions, [gameId]: SESSION_ROUNDS - 1 };
    setTokens(nextTokens);
    setGameSessions(nextSessions);
    window.localStorage.setItem(TOKENS_KEY, String(nextTokens));
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));

    if (cap !== null) {
      // The counter lives under the GROUP's key for a grouped game (so
      // every sibling sees the use), or the gameId itself otherwise.
      const lifetimeKey = groupKeyFor(gameId) ?? gameId;
      const nextLifetime = { ...lifetimeUses, [lifetimeKey]: getLifetimeUses(gameId) + 1 };
      setLifetimeUses(nextLifetime);
      window.localStorage.setItem(LIFETIME_KEY, JSON.stringify(nextLifetime));
    }

    return true;
  };

  const value = useMemo(
    () => ({
      mode,
      tokens,
      gameSessions,
      setMode,
      getRoundsRemaining,
      isFreeGame,
      isPremiumOnly,
      getSessionCost,
      getLifetimeCap,
      getLifetimeUses,
      isLifetimeExhausted,
      getLifetimeGroupLabel,
      grantTokens,
      startGameEntry,
    }),
    [mode, tokens, gameSessions, lifetimeUses],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useAccess must be used within AccessProvider");
  return context;
}
