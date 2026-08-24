// duckIntersectionTypes.ts
//
// Two interleaved streams at a 4-way crossroad: a duck facing one of 4
// cardinal directions against road-flow arrows ("does the duck match the
// road?"), and four corner math pods, one of which is "live" each trial
// ("is that corner's result even?"). Which stream is asked about switches
// unpredictably trial to trial — including sometimes staying on the same
// stream twice — same task-switching idea as the dual-box drill, but with
// a continuously-present duck instead of a stimulus that disappears
// between trials.

export type CardinalDirection = "NORTH" | "SOUTH" | "EAST" | "WEST";

export type QuadrantPosition = "NW" | "NE" | "SW" | "SE";

export type MathProblem = {
  expression: string; // e.g. "4 × 3"
  result: number;
  isEven: boolean;
};

export type DuckState = {
  facing: CardinalDirection;
  roadArrowDirection: CardinalDirection;
  isCongruent: boolean; // facing === roadArrowDirection
};

export type CornerMathGrid = Record<QuadrantPosition, MathProblem>;

export type ActiveQuestionType =
  | "motion-congruence" // "Does the duck match the road arrows?"
  | "quadrant-math"; // "Is the highlighted corner's result even?"

export type DuckTrial = {
  id: number;
  type: ActiveQuestionType;
  isSwitchTrial: boolean;
  duckState: DuckState;
  corners: CornerMathGrid;
  activeQuadrant: QuadrantPosition;
  correctAnswer: "YES" | "NO";
};

export type DuckTrialResult = {
  trialId: number;
  type: ActiveQuestionType;
  isSwitchTrial: boolean;
  userAnswer: "YES" | "NO";
  isCorrect: boolean;
  reactionTimeMs: number;
};

export type DuckGameResult = {
  totalTrials: number;
  correctCount: number;
  accuracyPct: number;
  avgReactionTimeMs: number;
  switchCostMs: number;
  score: number;
};
