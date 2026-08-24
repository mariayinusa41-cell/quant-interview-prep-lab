import type {
  CardinalDirection,
  CornerMathGrid,
  DuckGameResult,
  DuckState,
  DuckTrial,
  DuckTrialResult,
  MathProblem,
  QuadrantPosition,
} from "./duckIntersectionTypes";

const DIRECTIONS: CardinalDirection[] = ["NORTH", "SOUTH", "EAST", "WEST"];
const QUADRANTS: QuadrantPosition[] = ["NW", "NE", "SW", "SE"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** A simple, rapid arithmetic problem. Always non-negative, always exact. */
export function generateCornerMath(): MathProblem {
  const op = pick(["×", "+", "-"] as const);
  let a = 0;
  let b = 0;
  let res = 0;

  if (op === "×") {
    a = Math.floor(Math.random() * 7) + 2; // 2..8
    b = Math.floor(Math.random() * 7) + 2; // 2..8
    res = a * b;
  } else if (op === "+") {
    a = Math.floor(Math.random() * 15) + 3;
    b = Math.floor(Math.random() * 15) + 3;
    res = a + b;
  } else {
    a = Math.floor(Math.random() * 20) + 10; // 10..29
    b = Math.floor(Math.random() * (a - 2)) + 2; // 2..(a-1), always < a
    res = a - b;
  }

  return { expression: `${a} ${op} ${b}`, result: res, isEven: res % 2 === 0 };
}

export function generateCornerGrid(): CornerMathGrid {
  return { NW: generateCornerMath(), NE: generateCornerMath(), SW: generateCornerMath(), SE: generateCornerMath() };
}

/**
 * Generates the next trial. Which stream is asked about isn't forced to
 * alternate — same reasoning as the dual-box drill: a strict alternation
 * lets you anticipate the switch, which defeats the point. A run is capped
 * at 3 in a row.
 */
export function generateDuckTrial(trialId: number, prevType?: "motion-congruence" | "quadrant-math", runLength = 0): DuckTrial {
  let type: "motion-congruence" | "quadrant-math";
  if (prevType === undefined) {
    type = Math.random() < 0.5 ? "motion-congruence" : "quadrant-math";
  } else if (runLength >= 3) {
    type = prevType === "motion-congruence" ? "quadrant-math" : "motion-congruence";
  } else {
    type = Math.random() < 0.5 ? prevType : prevType === "motion-congruence" ? "quadrant-math" : "motion-congruence";
  }
  const isSwitchTrial = prevType !== undefined && type !== prevType;

  const duckFacing = pick(DIRECTIONS);
  const isMatch = Math.random() < 0.5;
  const arrowDir = isMatch ? duckFacing : pick(DIRECTIONS.filter((d) => d !== duckFacing));

  const duckState: DuckState = {
    facing: duckFacing,
    roadArrowDirection: arrowDir,
    isCongruent: duckFacing === arrowDir,
  };

  const corners = generateCornerGrid();
  const activeQuadrant = pick(QUADRANTS);

  const correctAnswer: "YES" | "NO" =
    type === "motion-congruence" ? (duckState.isCongruent ? "YES" : "NO") : corners[activeQuadrant].isEven ? "YES" : "NO";

  return { id: trialId, type, isSwitchTrial, duckState, corners, activeQuadrant, correctAnswer };
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export function computeDuckGameResult(results: DuckTrialResult[]): DuckGameResult {
  const totalTrials = results.length;
  const correct = results.filter((r) => r.isCorrect);
  const correctCount = correct.length;
  const accuracyPct = totalTrials ? Math.round((correctCount / totalTrials) * 100) : 0;
  const avgReactionTimeMs = Math.round(mean(results.map((r) => r.reactionTimeMs)));

  const repeatRTs = correct.filter((r) => !r.isSwitchTrial).map((r) => r.reactionTimeMs);
  const switchRTs = correct.filter((r) => r.isSwitchTrial).map((r) => r.reactionTimeMs);
  const switchCostMs = Math.round(mean(switchRTs) - mean(repeatRTs));

  const score = results.reduce((s, r) => {
    if (r.isCorrect) return s + Math.max(10, Math.round(100 - r.reactionTimeMs / 15));
    return Math.max(0, s - 40);
  }, 0);

  return { totalTrials, correctCount, accuracyPct, avgReactionTimeMs, switchCostMs, score };
}
