// Skill levels and track readiness — all DERIVED, nothing stored.
//
// There is deliberately no XP, level or rank here. An earlier version added
// one, and it immediately told players things like "25 more tickets to Desk
// Analyst — unlocks the casino floor". Nothing of the sort happens: access
// is governed by tokens and the Infinity Pass, so a rank ladder was
// inventing a second, fictional progression system that contradicted the
// real one. Tickets are the only progression currency, and the HUD already
// shows them.
//
// Everything below is a pure function of what ProgressContext already
// stores, so none of it can drift out of step with the HUD.

import { ALL_SKILLS, type SkillTag } from "./skills";

type SkillStat = { correct: number; incorrect: number; revealed: number };
type Skills = Partial<Record<SkillTag, SkillStat>>;

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
