// Assessments are the graded, timed exam on top of the practice games. They
// stay locked until there is enough evidence the player is ready: enough
// volume (tickets) AND enough reliability (accuracy). Volume alone is not
// enough — grinding wrong answers should not open the exam — and accuracy
// alone is not either, since 3-for-3 is not a track record.
export const ASSESSMENT_TICKETS = 100;
export const ASSESSMENT_ACCURACY = 60;

export type AssessmentGate = {
  unlocked: boolean;
  passMet: boolean;
  ticketsMet: boolean;
  accuracyMet: boolean;
  ticketsNeeded: number;
};

// Three conditions, all required: an Infinity Pass (this is paid content),
// enough volume, and enough reliability. Each blocks a different failure —
// no pass means it is not bought, low tickets means not enough practice,
// low accuracy means the practice is not sticking.
export function evaluateGate(
  tickets: number,
  accuracy: number | null,
  hasPass: boolean,
): AssessmentGate {
  const ticketsMet = tickets >= ASSESSMENT_TICKETS;
  const accuracyMet = accuracy !== null && accuracy >= ASSESSMENT_ACCURACY;
  return {
    unlocked: hasPass && ticketsMet && accuracyMet,
    passMet: hasPass,
    ticketsMet,
    accuracyMet,
    ticketsNeeded: Math.max(0, ASSESSMENT_TICKETS - tickets),
  };
}
