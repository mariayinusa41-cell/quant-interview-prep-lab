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
  grantTokens: (amount: number) => void;
  startGameEntry: (gameId: string) => boolean;
};

const MODE_KEY = "quant_access_mode";
const TOKENS_KEY = "quant_access_tokens";
const SESSIONS_KEY = "quant_game_sessions";
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
  // The other two Drills (Arithmetic, Sequence Sprint) are free forever —
  // Fermi is the deep one (586 questions, categories, difficulty tiers), so
  // it's the pass-gated upgrade rather than a token game priced so high it
  // was a wall in disguise.
  "drills-fermi-estimation",
]);

// Per-game token price overrides. Anything not listed here costs the
// default SESSION_COST (10 tokens) per SESSION_ROUNDS-round session.
// Everything token-purchasable is priced at double its old rate except
// Read the Shape, which stays at the base 10 — the intended "free preview"
// game for Statistics.
const GAME_COSTS: Record<string, number> = {
  "statistics-crack-the-bot": 40,
  "stochastic-ruin-walker": 30,
  "calculus-newton-stepper": 30,
  "probability-casino-russian-roulette": 20,
  "probability-scratch-timed-7": 20,
  "probability-scratch-untimed-7": 20,
  "actuarial-loss-triangle": 30,
  "econ-causal-confounder": 30,
  "econ-antitrust": 30,
  "risk-tail-stress": 30,
  "quantdev-order-book": 30,
  "quantdev-concurrency": 30,
  "actuarial-survival-run": 30,
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AccessMode>("developer");
  const [tokens, setTokens] = useState(STARTING_TOKENS);
  const [gameSessions, setGameSessions] = useState<Record<string, number>>({});

  useEffect(() => {
    const savedMode = window.localStorage.getItem(MODE_KEY);
    const savedTokensRaw = window.localStorage.getItem(TOKENS_KEY);
    const savedSessions = window.localStorage.getItem(SESSIONS_KEY);

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
  }, []);

  const setMode = (nextMode: AccessMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(MODE_KEY, nextMode);
    // The homepage is a product-mode preview, so entering Free mode starts a
    // clean example account instead of carrying state from another preview.
    if (nextMode === "free" && mode !== "free") {
      window.localStorage.setItem(TOKENS_KEY, String(STARTING_TOKENS));
      window.localStorage.setItem(SESSIONS_KEY, "{}");
      setTokens(STARTING_TOKENS);
      setGameSessions({});
    }
  };

  const getRoundsRemaining = (gameId: string) => gameSessions[gameId] ?? 0;
  const isFreeGame = (gameId: string) => FREE_GAME_IDS.has(gameId);
  const isPremiumOnly = (gameId: string) => PREMIUM_ONLY_GAME_IDS.has(gameId);
  const getSessionCost = (gameId: string) => GAME_COSTS[gameId] ?? SESSION_COST;

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

    const cost = getSessionCost(gameId);
    if (tokens < cost) return false;

    const nextTokens = tokens - cost;
    const nextSessions = { ...gameSessions, [gameId]: SESSION_ROUNDS - 1 };
    setTokens(nextTokens);
    setGameSessions(nextSessions);
    window.localStorage.setItem(TOKENS_KEY, String(nextTokens));
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));
    return true;
  };

  const value = useMemo(
    () => ({ mode, tokens, gameSessions, setMode, getRoundsRemaining, isFreeGame, isPremiumOnly, getSessionCost, grantTokens, startGameEntry }),
    [mode, tokens, gameSessions],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useAccess must be used within AccessProvider");
  return context;
}
