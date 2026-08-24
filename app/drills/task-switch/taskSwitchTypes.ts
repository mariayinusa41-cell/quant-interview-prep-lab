// taskSwitchTypes.ts
//
// The "ADHD zap" screen question: two rule sets (math parity, arrow
// congruence), one box "active" at a time, switching unpredictably —
// including sometimes staying on the same box twice in a row, which is
// exactly what makes it catch you out. Real cognitive-flexibility drills
// measure "switch cost": how much slower/less accurate you are on a trial
// right after the active box changed versus one where it stayed the same.

export type ActiveBox = "top" | "bottom";

export type TopMathProblem = {
  expression: string; // e.g. "5 × 2" or "7 + 8"
  result: number;
  isEven: boolean;
};

export type BottomArrowProblem = {
  arrows: string[]; // e.g. ["→", "→", "→", "→"] or ["→", "←", "→", "→"]
  isSame: boolean;
};

export type Trial = {
  id: number;
  box: ActiveBox;
  isSwitchTrial: boolean; // true if box differs from the previous trial
  mathProblem?: TopMathProblem;
  arrowProblem?: BottomArrowProblem;
  correctAnswer: "left" | "right";
  leftLabel: string; // e.g. "EVEN" or "SAME"
  rightLabel: string; // e.g. "ODD" or "DIFFERENT"
};

export type TrialResult = {
  trialId: number;
  box: ActiveBox;
  isSwitchTrial: boolean;
  userAnswer: "left" | "right";
  isCorrect: boolean;
  reactionTimeMs: number;
};

export type TaskSwitchAnalytics = {
  totalTrials: number;
  accuracyPct: number;
  avgReactionTimeMs: number;
  avgRepeatRT: number;
  avgSwitchRT: number;
  switchCostMs: number; // switch RT − repeat RT
  score: number;
  quantGrade: "Elite" | "Strong" | "Average" | "Needs Speed Reps";
};
