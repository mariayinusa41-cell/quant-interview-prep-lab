import type { ActiveBox, BottomArrowProblem, TaskSwitchAnalytics, TopMathProblem, Trial, TrialResult } from "./taskSwitchTypes";

const ARROWS = ["↑", "→", "↓", "←"]; // up, right, down, left
const ARROW_ROW_LEN = 4;

function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMathProblem(): TopMathProblem {
  const op = pick(["+", "-", "×"] as const);
  let a: number, b: number, result: number, expression: string;
  if (op === "+") {
    a = randInt(2, 19);
    b = randInt(2, 19);
    result = a + b;
    expression = `${a} + ${b}`;
  } else if (op === "-") {
    a = randInt(5, 20);
    b = randInt(1, a); // never negative
    result = a - b;
    expression = `${a} - ${b}`;
  } else {
    a = randInt(2, 9);
    b = randInt(2, 9);
    result = a * b;
    expression = `${a} × ${b}`;
  }
  return { expression, result, isEven: result % 2 === 0 };
}

function generateArrowProblem(): BottomArrowProblem {
  const isSame = Math.random() > 0.5;
  const base = pick(ARROWS);
  let arrows: string[];
  if (isSame) {
    arrows = Array.from({ length: ARROW_ROW_LEN }, () => base);
  } else {
    // Guarantee at least one arrow differs from the rest — pick a random
    // slot and force a different direction there, fill the rest with base.
    arrows = Array.from({ length: ARROW_ROW_LEN }, () => base);
    const oddSlot = randInt(0, ARROW_ROW_LEN - 1);
    const others = ARROWS.filter((a) => a !== base);
    arrows[oddSlot] = pick(others);
  }
  return { arrows, isSame };
}

/**
 * Builds a trial sequence. Which box is active is chosen independently each
 * trial (not forced to alternate) — "sometimes it stays twice" is the whole
 * point, since a forced strict alternation would let you anticipate the
 * switch and defeats the task-switching cost the drill is trying to measure.
 * A run is capped at 3 in a row so it doesn't feel like a different game for
 * a stretch.
 */
export function generateTrialSequence(totalTrials: number): Trial[] {
  const trials: Trial[] = [];
  let prevBox: ActiveBox | null = null;
  let runLength = 0;

  for (let i = 0; i < totalTrials; i++) {
    let box: ActiveBox;
    if (prevBox === null) {
      box = pick<ActiveBox>(["top", "bottom"]);
    } else if (runLength >= 3) {
      box = prevBox === "top" ? "bottom" : "top"; // force a switch
    } else {
      box = Math.random() > 0.5 ? prevBox : (prevBox === "top" ? "bottom" : "top");
    }
    runLength = box === prevBox ? runLength + 1 : 1;

    const isSwitchTrial = prevBox !== null && box !== prevBox;

    if (box === "top") {
      const mathProblem = generateMathProblem();
      trials.push({
        id: i,
        box,
        isSwitchTrial,
        mathProblem,
        correctAnswer: mathProblem.isEven ? "left" : "right",
        leftLabel: "EVEN",
        rightLabel: "ODD",
      });
    } else {
      const arrowProblem = generateArrowProblem();
      trials.push({
        id: i,
        box,
        isSwitchTrial,
        arrowProblem,
        correctAnswer: arrowProblem.isSame ? "left" : "right",
        leftLabel: "SAME",
        rightLabel: "DIFFERENT",
      });
    }

    prevBox = box;
  }

  return trials;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export function computeTaskSwitchAnalytics(results: TrialResult[]): TaskSwitchAnalytics {
  const totalTrials = results.length;
  const correct = results.filter((r) => r.isCorrect);
  const accuracyPct = totalTrials ? Math.round((correct.length / totalTrials) * 100) : 0;

  const rts = results.map((r) => r.reactionTimeMs);
  const avgReactionTimeMs = Math.round(mean(rts));

  // Switch cost is measured on correct trials only — an error's reaction
  // time doesn't tell you anything about switching speed, just that the
  // wrong rule got applied.
  const repeatRTs = correct.filter((r) => !r.isSwitchTrial).map((r) => r.reactionTimeMs);
  const switchRTs = correct.filter((r) => r.isSwitchTrial).map((r) => r.reactionTimeMs);
  const avgRepeatRT = Math.round(mean(repeatRTs));
  const avgSwitchRT = Math.round(mean(switchRTs));
  const switchCostMs = avgSwitchRT - avgRepeatRT;

  const score = Math.round(accuracyPct * 10 - switchCostMs * 0.5);

  let quantGrade: TaskSwitchAnalytics["quantGrade"];
  if (accuracyPct >= 90 && switchCostMs <= 120) quantGrade = "Elite";
  else if (accuracyPct >= 80 && switchCostMs <= 200) quantGrade = "Strong";
  else if (accuracyPct >= 65) quantGrade = "Average";
  else quantGrade = "Needs Speed Reps";

  return { totalTrials, accuracyPct, avgReactionTimeMs, avgRepeatRT, avgSwitchRT, switchCostMs, score, quantGrade };
}
