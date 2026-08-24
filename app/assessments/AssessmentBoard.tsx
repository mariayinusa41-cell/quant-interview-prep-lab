"use client";

import { useProfile } from "../profile/ProfileContext";
import { TRACK_BY_ID } from "../profile/tracks";
import { ASSESSMENTS } from "./catalog";
import GateBars, { useAssessmentGate } from "./GateBars";

export default function AssessmentBoard() {
  const { profile } = useProfile();
  const gate = useAssessmentGate();

  // Only the tracks the player selected at signup. A guest who skipped that
  // step sees everything rather than an empty board.
  const myTracks = profile.tracks.length > 0 ? profile.tracks : null;
  const visible = myTracks
    ? ASSESSMENTS.filter((a) => myTracks.includes(a.track))
    : ASSESSMENTS;
  const hidden = ASSESSMENTS.length - visible.length;

  return (
    <section className="section">
      <h2>Assessments</h2>
      <p className="section-intro">
        Timed, graded, one sitting at a time — each modelled on a real firm&rsquo;s published screen.
        Every attempt generates fresh questions, so a score is earned rather than remembered.
      </p>

      <GateBars />

      <div className="assess-list">
        {visible.map((a) => (
          <a
            href={gate.unlocked ? `/assessments/${a.id}` : undefined}
            className={gate.unlocked ? "assess-card is-unlocked is-link" : "assess-card"}
            key={a.id}
            aria-disabled={!gate.unlocked}
            onClick={(e) => { if (!gate.unlocked) e.preventDefault(); }}
          >
            <span className="assess-card-icon" aria-hidden="true">{gate.unlocked ? "▶" : "■"}</span>
            <span className="assess-card-body">
              <strong>{a.title}</strong>
              <span className="assess-card-firm">{a.firm} · {TRACK_BY_ID[a.track]?.label}</span>
              <span>{a.blurb}</span>
            </span>
            <span className="assess-card-state">{gate.unlocked ? "Start" : "Locked"}</span>
          </a>
        ))}
      </div>

      <p className="assess-footnote">
        {hidden > 0
          ? `${hidden} more assessment${hidden === 1 ? "" : "s"} are available on tracks you haven't selected — add a track in your profile to see them.`
          : "Showing every assessment for your selected tracks."}
      </p>
    </section>
  );
}
