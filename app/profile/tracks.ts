import type { SkillTag } from "../progress/skills";

export type TrackId =
  | "quant-trading"
  | "quant-research"
  | "quant-dev"
  | "risk"
  | "econ-consulting"
  | "actuary";

export type Track = {
  id: TrackId;
  label: string;
  blurb: string;
  /** Skills weighted most heavily for this track's readiness. */
  coreSkills: SkillTag[];
};

// Tracks weight skills rather than hiding games: a game shared by several
// tracks still shows for all of them, it just counts for more or less
// toward each one's readiness. That keeps the shared core shared.
export const TRACKS: Track[] = [
  {
    id: "quant-trading",
    label: "Quant Trading",
    blurb: "Fast probability, EV under pressure, market intuition.",
    coreSkills: ["expected-value", "mental-math", "market-making", "conditional-probability"],
  },
  {
    id: "quant-research",
    label: "Quant Research",
    blurb: "Stochastic models, statistics, and proving your edge is real.",
    coreSkills: ["distributions", "regression", "selection-bias", "markov-chains"],
  },
  {
    id: "quant-dev",
    label: "Quant Developer",
    blurb: "Complexity, data structures, and code that survives review.",
    coreSkills: ["complexity", "dynamic-programming", "data-structures", "coding-implementation"],
  },
  {
    id: "risk",
    label: "Risk Analyst",
    blurb: "Tail risk, loss distributions, and what breaks under stress.",
    coreSkills: ["distributions", "expected-value", "optional-stopping", "monte-carlo"],
  },
  {
    id: "econ-consulting",
    label: "Economic Consulting",
    blurb: "Market sizing, causal claims, and game-theoretic reasoning.",
    coreSkills: ["estimation", "regression", "game-theory", "logic-puzzles"],
  },
  {
    id: "actuary",
    label: "Actuary",
    blurb: "Ruin theory, survival models, and long-horizon expectation.",
    coreSkills: ["expected-value", "distributions", "optional-stopping", "markov-chains"],
  },
];

export const TRACK_BY_ID: Record<TrackId, Track> = TRACKS.reduce(
  (acc, track) => {
    acc[track.id] = track;
    return acc;
  },
  {} as Record<TrackId, Track>,
);

export const MAJORS = [
  "Mathematics",
  "Statistics",
  "Computer Science",
  "Economics",
  "Physics",
  "Engineering",
  "Finance",
  "Data Science",
  "Biology / Life Sciences",
  "Other",
];

export const EXPERIENCE_LEVELS = [
  "Undergraduate",
  "Master's",
  "PhD",
  "Working professional",
  "Career switcher",
];

// Coarse bands rather than an exact age: it is enough to shape recommendations
// and is less sensitive to store than a birth date.
export const AGE_BANDS = ["Under 20", "20-24", "25-29", "30-39", "40+", "Prefer not to say"];
