// Data spec for a story teaser. Screwy Pirates proved the shape that works —
// staged pixel scene, timed captions, assumptions, the question, then a
// step-by-step answer and a breakdown. Encoding that as data means a new
// teaser is a data entry, not a thousand bespoke lines.

export type CastMember = {
  id: string;
  label?: string;
  sprite: string;
  palette: string;
};

// A payoff matrix beat — the visual that makes game theory legible. Rows are
// player 1's choices, columns player 2's; each cell is "p1,p2".
export type PayoffMatrix = {
  rowPlayer: string;
  colPlayer: string;
  rowChoices: string[];
  colChoices: string[];
  cells: string[][];
  highlight?: [number, number] | null;
  caption?: string;
};

export type Beat = {
  caption?: string;
  hold: number; // ms to sit on this beat before auto-advancing
  show?: string[]; // cast ids on stage (omit = keep previous)
  dim?: string[]; // cast ids shown but greyed
  lit?: string[]; // cast ids emphasised
  matrix?: PayoffMatrix;
  note?: string;
};

export type AnswerStep = {
  label: string;
  text: string;
};

export type BreakdownSection = {
  heading: string;
  body: string;
};

export type Teaser = {
  slug: string;
  title: string;
  tag: string;
  description: string;
  sprite: string; // icon sprite for the index tile
  palette: string;
  cast: CastMember[];
  beats: Beat[];
  assumptions: string[];
  question: string;
  // Free-text guess captured before the answer opens — no grading, the point
  // is committing to an answer before seeing one.
  guessPlaceholder: string;
  answerHeadline: string;
  answerSteps: AnswerStep[];
  breakdown: BreakdownSection[];
};
