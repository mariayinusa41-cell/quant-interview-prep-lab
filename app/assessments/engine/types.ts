import type { SkillTag } from "../../progress/skills";
import type { TrackId } from "../../profile/tracks";

export type ItemKind = "numeric" | "choice" | "code";

/** One generated question. Generators produce these fresh on every attempt. */
/**
 * A hidden test case. Pure functions use `args`/`expected`. Stateful problems
 * — where the candidate returns a factory — use `ctor` plus a `script` of
 * method calls, since a single call/return pair cannot express "put, put,
 * get, evict".
 */
export type CodeTest = {
  label: string;
  args?: unknown[];
  expected?: unknown;
  ctor?: unknown[];
  script?: { call: string; args: unknown[]; expect?: unknown }[];
};

/**
 * Optional performance gate. The candidate is timed against a reference
 * implementation running the identical workload in the same worker, so the
 * verdict does not depend on how fast the machine is.
 */
export type PerfSpec = {
  /** Source defining the reference implementation under `functionName`. */
  reference: string;
  /** Source defining `__bench(factory)` returning elapsed milliseconds. */
  bench: string;
  /** Candidate fails above this multiple of the reference. */
  budget: number;
  /** Shown to the candidate so the constraint is not a surprise. */
  note: string;
};

export type Item = {
  id: string;
  kind: ItemKind;
  prompt: string;
  /** Rendered above the prompt in monospace when present (code, data, tape). */
  block?: string;
  choices?: string[];
  /** Index into choices, or the numeric answer. Not used by "code" items. */
  answer?: number;
  /** Numeric items accept anything within this absolute tolerance. */
  tolerance?: number;
  skill: SkillTag;
  /** Shown only in the review screen, never during the timed run. */
  explain?: string;

  /* ---- code items ---- */
  /** Longer statement rendered above the editor. */
  description?: string;
  functionName?: string;
  starter?: string;
  tests?: CodeTest[];
  perf?: PerfSpec;
};

export type Section = {
  id: string;
  name: string;
  /** Shown on the section card before it starts. */
  brief: string;
  seconds: number;
  /** How many items the section serves — declared so the manifest can show
   *  it without generating a set purely to count it. */
  itemCount: number;
  /** Built fresh per attempt so no two sittings are identical. */
  generate: () => Item[];
  /**
   * Points lost per wrong answer. Optiver-style screens use 1 — which makes
   * skipping a real decision rather than a free option, exactly as the live
   * test intends.
   */
  penalty: number;
  /** Whether a candidate may return to earlier items in this section. */
  allowBack: boolean;
};

export type Assessment = {
  id: string;
  /** Firm whose published format this is modelled on. */
  firm: string;
  title: string;
  track: TrackId;
  blurb: string;
  /** Format notes shown on the lobby card — duration, marking, rules. */
  rules: string[];
  sections: Section[];
};

export type ItemResult = {
  itemId: string;
  skill: SkillTag;
  answered: boolean;
  correct: boolean;
  /** Milliseconds spent before submitting this item. */
  ms: number;
  given?: string;
};

export type SectionResult = {
  sectionId: string;
  name: string;
  raw: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
};

export type AttemptResult = {
  assessmentId: string;
  startedAt: number;
  finishedAt: number;
  sections: SectionResult[];
  items: ItemResult[];
  scaled: number;
  maxScaled: number;
};

/** Deterministic-ish helpers shared by every generator. */
export const rnd = {
  int: (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1)),
  pick: <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)],
  shuffle: <T,>(xs: T[]): T[] => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
};

/** Builds a 4-option multiple choice item with the answer placed randomly. */
export function choiceItem(
  id: string,
  prompt: string,
  correct: string,
  distractors: string[],
  skill: SkillTag,
  explain?: string,
  block?: string,
): Item {
  const all = rnd.shuffle([correct, ...distractors]);
  return {
    id, kind: "choice", prompt, block,
    choices: all,
    answer: all.indexOf(correct),
    skill, explain,
  };
}
