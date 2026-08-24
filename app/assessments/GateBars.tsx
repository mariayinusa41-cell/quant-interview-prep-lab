"use client";

import { useProgress } from "../progress/ProgressContext";
import { useAccess } from "../access/AccessContext";
import { ASSESSMENT_ACCURACY, ASSESSMENT_TICKETS, evaluateGate, type AssessmentGate } from "./requirements";

/** Shared unlock state, so Assessments and Mock Interview stay in step. */
export function useAssessmentGate(): AssessmentGate {
  const { tickets, accuracy } = useProgress();
  const { mode } = useAccess();
  // Developer mode is the local preview tier — it opens everything, the same
  // way it does for games, so there is no gate to grind past while building.
  if (mode === "developer") {
    return { unlocked: true, passMet: true, ticketsMet: true, accuracyMet: true, ticketsNeeded: 0 };
  }
  return evaluateGate(tickets, accuracy, mode === "infinity");
}

export default function GateBars() {
  const { tickets, accuracy } = useProgress();
  const gate = useAssessmentGate();

  const ticketPct = Math.min(100, Math.round((tickets / ASSESSMENT_TICKETS) * 100));
  const accPct = Math.min(100, Math.round(((accuracy ?? 0) / ASSESSMENT_ACCURACY) * 100));

  return (
    <div className="assess-gate" aria-label="Unlock requirements">
      <div className={gate.passMet ? "assess-req is-met" : "assess-req"}>
        <span className="assess-req-head">
          <strong>Infinity Pass</strong>
          <span className="assess-req-state">{gate.passMet ? "MET" : "Required"}</span>
        </span>
        <span className="assess-req-bar"><span style={{ width: gate.passMet ? "100%" : "0%" }} /></span>
      </div>

      <div className={gate.ticketsMet ? "assess-req is-met" : "assess-req"}>
        <span className="assess-req-head">
          <strong>{tickets}</strong> / {ASSESSMENT_TICKETS} tickets
          <span className="assess-req-state">{gate.ticketsMet ? "MET" : `${gate.ticketsNeeded} to go`}</span>
        </span>
        <span className="assess-req-bar"><span style={{ width: `${ticketPct}%` }} /></span>
      </div>

      <div className={gate.accuracyMet ? "assess-req is-met" : "assess-req"}>
        <span className="assess-req-head">
          <strong>{accuracy === null ? "--" : `${accuracy}%`}</strong> / {ASSESSMENT_ACCURACY}% accuracy
          <span className="assess-req-state">{gate.accuracyMet ? "MET" : "Not yet"}</span>
        </span>
        <span className="assess-req-bar"><span style={{ width: `${accPct}%` }} /></span>
      </div>
    </div>
  );
}
