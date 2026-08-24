"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SkillTag } from "./skills";

/**
 * Three separate numbers, deliberately kept apart:
 *
 *   TOKENS   — currency. Free users only. Spent to unlock sessions.
 *              Lives in AccessContext, not here.
 *   TICKETS  — volume. One per question answered correctly, first try.
 *              Never decreases; a wrong answer costs nothing.
 *   ACCURACY — quality. correct / graded * 100, so it moves both ways.
 *
 * Tickets and accuracy answer different questions ("how much have you put
 * in" vs "how reliable are you"), which is why neither one substitutes for
 * the other: a high-volume sloppy player and a low-volume precise one are
 * meant to look different.
 */

// A graded attempt at one answerable thing. Deliberately NOT the same as
// the outcome of a game: losing a hand of blackjack or busting on a random
// walk is variance, not a mistake, so game outcomes never reach this type.
// Only questions the player could have gotten right are recorded.
export type AttemptOutcome = "correct" | "incorrect" | "revealed";

type SkillStat = { correct: number; incorrect: number; revealed: number };

export type Attempt = { skill: SkillTag; outcome: AttemptOutcome };

type ProgressContextValue = {
  tickets: number;
  /** 0-100, or null before any graded attempt exists. */
  accuracy: number | null;
  graded: number;
  skills: Partial<Record<SkillTag, SkillStat>>;
  skillAccuracy: (skill: SkillTag) => number | null;
  recordAttempt: (skill: SkillTag, outcome: AttemptOutcome) => void;
  recordAttempts: (attempts: Attempt[]) => void;
  resetProgress: () => void;
};

const PROGRESS_KEY = "quant_progress_v1";

type StoredProgress = {
  tickets: number;
  skills: Partial<Record<SkillTag, SkillStat>>;
};

const EMPTY: StoredProgress = { tickets: 0, skills: {} };

function emptyStat(): SkillStat {
  return { correct: 0, incorrect: 0, revealed: 0 };
}

// "revealed" sits in the denominator but never the numerator — looking up
// the answer should cost accuracy the same way a wrong answer does, while
// still not being counted as a success.
function statTotals(skills: Partial<Record<SkillTag, SkillStat>>) {
  let correct = 0;
  let graded = 0;
  Object.values(skills).forEach((stat) => {
    if (!stat) return;
    correct += stat.correct;
    graded += stat.correct + stat.incorrect + stat.revealed;
  });
  return { correct, graded };
}

function accuracyOf(stat: SkillStat | undefined): number | null {
  if (!stat) return null;
  const graded = stat.correct + stat.incorrect + stat.revealed;
  if (graded === 0) return null;
  return Math.round((stat.correct / graded) * 100);
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredProgress>(EMPTY);
  // Nothing is written back until the stored value has been read, otherwise
  // the first render would clobber real progress with an empty record.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredProgress>;
        const tickets = Number(parsed.tickets);
        setState({
          tickets: Number.isFinite(tickets) && tickets >= 0 ? tickets : 0,
          skills: parsed.skills && typeof parsed.skills === "object" ? parsed.skills : {},
        });
      }
    } catch {
      setState(EMPTY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persisting is a side effect of state changing, not something done inside
  // the reducer — the updater below has to stay pure so React can safely
  // re-invoke it (which StrictMode does in development).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — progress stays in memory for this session */
    }
  }, [state, hydrated]);

  const recordAttempts = (attempts: Attempt[]) => {
    if (attempts.length === 0) return;
    setState((prev) => {
      const skills = { ...prev.skills };
      let earned = 0;

      attempts.forEach(({ skill, outcome }) => {
        const stat = { ...(skills[skill] ?? emptyStat()) };
        if (outcome === "correct") {
          stat.correct += 1;
          earned += 1;
        } else if (outcome === "incorrect") {
          stat.incorrect += 1;
        } else {
          stat.revealed += 1;
        }
        skills[skill] = stat;
      });

      return { tickets: prev.tickets + earned, skills };
    });
  };

  const recordAttempt = (skill: SkillTag, outcome: AttemptOutcome) => recordAttempts([{ skill, outcome }]);

  const resetProgress = () => setState(EMPTY);

  const value = useMemo(() => {
    const { correct, graded } = statTotals(state.skills);
    return {
      tickets: state.tickets,
      graded,
      accuracy: graded === 0 ? null : Math.round((correct / graded) * 100),
      skills: state.skills,
      skillAccuracy: (skill: SkillTag) => accuracyOf(state.skills[skill]),
      recordAttempt,
      recordAttempts,
      resetProgress,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used within ProgressProvider");
  return context;
}
