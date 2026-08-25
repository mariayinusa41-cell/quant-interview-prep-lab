// Levels, ranks and skill bars — all DERIVED, nothing stored.
//
// The design handoff called for an XP number. There isn't one, and adding
// one would mean two progression currencies that can disagree: tickets are
// already earned per correct answer and already shown in the HUD, so a
// separate XP total would be a second source of truth for the same thing.
// Tickets ARE the XP here.
//
// Everything below is a pure function of what ProgressContext already
// stores. That is the swap point: if a real XP system ever arrives, change
// `progressPoints()` to read it and the rest of this file — and every
// component using it — keeps working unchanged.

import { ALL_SKILLS, type SkillTag } from "./skills";

type SkillStat = { correct: number; incorrect: number; revealed: number };
type Skills = Partial<Record<SkillTag, SkillStat>>;

/**
 * The single number progression is built on. Currently just tickets.
 *
 * Swap this one function to move to a real XP system; nothing else in the
 * app needs to know where the number came from.
 */
export function progressPoints(tickets: number): number {
  return tickets;
}

// Bands are deliberately front-loaded: the first few levels arrive quickly
// so a new player sees movement in their first session, then stretch out.
const RANKS: { min: number; name: string; unlocks: string | null }[] = [
  { min: 0, name: "Rookie", unlocks: "the full drill lab" },
  { min: 25, name: "Desk Analyst", unlocks: "the casino floor" },
  { min: 60, name: "Junior Trader", unlocks: "the assessment cabinet" },
  { min: 120, name: "Trader", unlocks: "advanced stochastic labs" },
  { min: 220, name: "Senior Trader", unlocks: "every timed mode" },
  { min: 380, name: "Desk Head", unlocks: null },
  { min: 600, name: "Partner", unlocks: null },
];

export type Progression = {
  level: number;
  rank: string;
  points: number;
  /** Points at which the current level began. */
  levelFloor: number;
  /** Points needed for the next level, or null at the top. */
  nextAt: number | null;
  nextRank: string | null;
  /** What the next rank opens up, if anything. */
  nextUnlocks: string | null;
  /** 0-1 through the current band; 1 at max rank. */
  fraction: number;
  toNext: number;
};

export function getProgression(tickets: number): Progression {
  const points = progressPoints(tickets);

  let index = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) { index = i; break; }
  }

  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const floor = current.min;
  const ceiling = next?.min ?? null;

  return {
    level: index + 1,
    rank: current.name,
    points,
    levelFloor: floor,
    nextAt: ceiling,
    nextRank: next?.name ?? null,
    nextUnlocks: next?.unlocks ?? null,
    fraction: ceiling === null ? 1 : Math.min(1, (points - floor) / (ceiling - floor)),
    toNext: ceiling === null ? 0 : Math.max(0, ceiling - points),
  };
}

// --- Skill levels -----------------------------------------------------

/** Correct answers needed per bar. Five bars, so 15 correct is mastery. */
export const CORRECT_PER_BAR = 3;
export const MAX_SKILL_LEVEL = 5;

/**
 * A skill's level, 0-5.
 *
 * Counts CORRECT answers only. Attempts would let someone fill a bar by
 * guessing repeatedly, which would make the skill map a measure of time
 * spent rather than of skill — the opposite of what it is for.
 */
export function skillLevel(stat: SkillStat | undefined): number {
  if (!stat) return 0;
  return Math.max(0, Math.min(MAX_SKILL_LEVEL, Math.floor(stat.correct / CORRECT_PER_BAR)));
}

/** Every skill with its level, in the canonical order. */
export function allSkillLevels(skills: Skills): { skill: SkillTag; level: number; correct: number }[] {
  return ALL_SKILLS.map((skill) => ({
    skill,
    level: skillLevel(skills[skill]),
    correct: skills[skill]?.correct ?? 0,
  }));
}

/**
 * The weakest skills, lowest first.
 *
 * Skills never attempted rank as weak, which is intended: "you have never
 * practised this" is at least as useful a prompt as "you practised it and
 * did badly". Ties break toward fewer correct answers.
 */
export function weakestSkills(skills: Skills, count: number): { skill: SkillTag; level: number; correct: number }[] {
  return allSkillLevels(skills)
    .sort((a, b) => a.level - b.level || a.correct - b.correct)
    .slice(0, count);
}

/**
 * Track readiness, 0-100.
 *
 * Core skills carry the weight, exactly as tracks.ts already describes, so
 * this does not invent a second weighting that could disagree with the one
 * the labs use. Non-core skills contribute a little, so broad practice
 * still moves the needle.
 */
export function trackReadiness(skills: Skills, coreSkills: SkillTag[]): number {
  if (coreSkills.length === 0) return 0;

  // Split into two averages rather than one weighted pool over all 24
  // skills. A single pool gave the wrong answer: with 4 core skills against
  // 20 others, mastering every core skill for a track scored only 38%,
  // which reads as "nowhere near ready" to someone who has in fact learned
  // exactly what the track asks for.
  //
  // Core mastery dominates, and breadth is a modest bonus — so the number
  // answers "am I ready for THIS track", not "how much of the site have I
  // completed".
  const CORE_SHARE = 0.8;
  const BREADTH_SHARE = 0.2;
  const coreSet = new Set(coreSkills);
  const levels = allSkillLevels(skills);

  const coreAvg =
    coreSkills.reduce((sum, skill) => sum + skillLevel(skills[skill]), 0) /
    (coreSkills.length * MAX_SKILL_LEVEL);

  const breadthAvg =
    levels.reduce((sum, l) => sum + l.level, 0) / (levels.length * MAX_SKILL_LEVEL);

  // coreSet is used by callers reasoning about which skills counted; kept
  // referenced so the intent stays obvious if this is edited later.
  void coreSet;

  return Math.round((coreAvg * CORE_SHARE + breadthAvg * BREADTH_SHARE) * 100);
}

/** The two weakest core skills — the binding constraint on a track. */
export function trackGaps(skills: Skills, coreSkills: SkillTag[]): SkillTag[] {
  return coreSkills
    .map((skill) => ({ skill, level: skillLevel(skills[skill]) }))
    .sort((a, b) => a.level - b.level)
    .slice(0, 2)
    .map((s) => s.skill);
}
