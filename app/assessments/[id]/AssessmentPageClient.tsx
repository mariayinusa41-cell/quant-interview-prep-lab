"use client";

import { ASSESSMENT_BY_ID } from "../catalog";
import AssessmentRunner from "../engine/AssessmentRunner";
import { useAssessmentGate } from "../GateBars";
import { useProfile } from "../../profile/ProfileContext";
import { useAccess } from "../../access/AccessContext";


export default function AssessmentPageClient({ id }: { id: string }) {
  const assessment = ASSESSMENT_BY_ID[id];
  const gate = useAssessmentGate();
  const { profile, ready } = useProfile();
  const { mode } = useAccess();
  if (!assessment) {
    return (
      <section className="exam-panel">
        <h2 className="exam-h1">Assessment not found</h2>
        <p className="exam-lead">No assessment matches that reference.</p>
        <a href="/" className="exam-btn is-secondary">Return</a>
      </section>
    );
  }

  if (!ready) return null;

  // Developer mode ignores the track filter too — otherwise you can only ever
  // open the one assessment matching whatever track you happened to pick.
  const onTrack =
    mode === "developer" || profile.tracks.length === 0 || profile.tracks.includes(assessment.track);

  if (!gate.unlocked) {
    return (
      <>
        <header className="exam-header">
          <h1 className="exam-header-title">{assessment.title}</h1>
          <div className="exam-header-meta"><span>Status <b>Not eligible</b></span></div>
        </header>
        <section className="exam-panel">
          <p className="exam-eyebrow">{assessment.firm}</p>
          <h2 className="exam-h1">This session is not available to you</h2>
          <p className="exam-lead">
            Eligibility requires an Infinity Pass
            {!gate.ticketsMet && <>, at least {gate.ticketsNeeded} further tickets</>}
            {!gate.accuracyMet && <>, and an accuracy of 60% or better</>}.
          </p>
          <a href="/" className="exam-btn is-secondary">Return</a>
        </section>
      </>
    );
  }

  if (!onTrack) {
    return (
      <>
        <header className="exam-header">
          <h1 className="exam-header-title">{assessment.title}</h1>
          <div className="exam-header-meta"><span>Status <b>Not assigned</b></span></div>
        </header>
        <section className="exam-panel">
          <p className="exam-eyebrow">{assessment.firm}</p>
          <h2 className="exam-h1">This assessment is not assigned to you</h2>
          <p className="exam-lead">
            It belongs to a track you have not selected. Update your track selection to become
            eligible.
          </p>
          <a href="/?login=1" className="exam-btn is-secondary">Update track selection</a>
        </section>
      </>
    );
  }

  return <AssessmentRunner assessment={assessment} />;
}
