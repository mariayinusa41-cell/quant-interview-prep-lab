"use client";

import { useProfile } from "../profile/ProfileContext";
import { useProgress } from "../progress/ProgressContext";
import { TRACK_BY_ID } from "../profile/tracks";
import { ASSESSMENTS } from "./catalog";
import { useAssessmentGate } from "./GateBars";
import { ASSESSMENT_ACCURACY, ASSESSMENT_TICKETS } from "./requirements";
import type { Assessment } from "./engine/types";

/**
 * Duration and question count, summed from the sections the assessment
 * actually serves. Both already live on `Section` (`seconds`, `itemCount`),
 * so this is derived rather than a second hand-maintained number that could
 * drift away from what the runner really does.
 */
function examMeta(a: Assessment): string {
  const seconds = a.sections.reduce((sum, s) => sum + s.seconds, 0);
  const items = a.sections.reduce((sum, s) => sum + s.itemCount, 0);
  const mins = Math.round(seconds / 60);
  return `${mins} min · ${items} Q`;
}

export default function AssessmentBoard() {
  const { profile } = useProfile();
  const { tickets, accuracy } = useProgress();
  const gate = useAssessmentGate();

  // Which tracks are "yours". A guest who skipped that step has none, and
  // everything reads as on-track rather than everything reading as off.
  const myTracks = profile.tracks.length > 0 ? profile.tracks : null;
  const onTrack = (a: Assessment) => !myTracks || myTracks.includes(a.track);
  const offTrackCount = ASSESSMENTS.filter((a) => !onTrack(a)).length;
  const onTrackCount = ASSESSMENTS.length - offTrackCount;

  const ticketPct = Math.min(100, Math.round((tickets / ASSESSMENT_TICKETS) * 100));
  const accPct = Math.min(100, Math.round(((accuracy ?? 0) / ASSESSMENT_ACCURACY) * 100));

  return (
    <>
      <section className="arc-hero is-neutral is-hazard" aria-label="Assessment unlock requirements">
        <div className="arc-hero-split">
          <div>
            <p className="arc-eyebrow is-bad">Cabinet locked // three bolts</p>
            <h2 className="arc-hero-title">Assessments</h2>
            <p className="arc-intro" style={{ marginBottom: 8 }}>
              Timed, graded, one sitting at a time — each modelled on a real firm&rsquo;s published screen.
              Every attempt generates fresh questions, so a score is earned rather than remembered.
            </p>
            <p className="arc-note" style={{ marginTop: 0 }}>
              Drop all three bolts and the door opens for good.
            </p>
          </div>

          <div className="arc-bolts" aria-label="Unlock requirements">
            <div className={gate.passMet ? "arc-bolt is-met" : "arc-bolt"}>
              <span className="arc-bolt-head">
                <span className={gate.passMet ? "arc-bolt-dot" : "arc-bolt-dot is-unmet"} aria-hidden="true" />
                <span className="arc-bolt-label">Infinity Pass</span>
                <span className="arc-bolt-state">{gate.passMet ? "MET" : "REQUIRED"}</span>
              </span>
              <span className="arc-bolt-bar">
                <span style={{ width: gate.passMet ? "100%" : "0%" }} />
              </span>
            </div>

            <div className={gate.ticketsMet ? "arc-bolt is-met" : "arc-bolt"}>
              <span className="arc-bolt-head">
                <span className={gate.ticketsMet ? "arc-bolt-dot" : "arc-bolt-dot is-unmet"} aria-hidden="true" />
                <span className="arc-bolt-label">
                  {tickets} / {ASSESSMENT_TICKETS} tickets
                </span>
                <span className="arc-bolt-state">
                  {gate.ticketsMet ? "MET" : `${gate.ticketsNeeded} TO GO`}
                </span>
              </span>
              <span className="arc-bolt-bar">
                <span style={{ width: `${ticketPct}%` }} />
              </span>
            </div>

            <div className={gate.accuracyMet ? "arc-bolt is-met" : "arc-bolt"}>
              <span className="arc-bolt-head">
                <span className={gate.accuracyMet ? "arc-bolt-dot" : "arc-bolt-dot is-unmet"} aria-hidden="true" />
                <span className="arc-bolt-label">
                  {accuracy === null ? "--" : `${accuracy}%`} / {ASSESSMENT_ACCURACY}% accuracy
                </span>
                <span className="arc-bolt-state">{gate.accuracyMet ? "MET" : "NOT YET"}</span>
              </span>
              <span className="arc-bolt-bar">
                <span style={{ width: `${accPct}%` }} />
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="arc-head-row">
          <h2>Exam cabinets</h2>
          <span className="arc-count">
            {myTracks
              ? `${onTrackCount} of ${ASSESSMENTS.length} on your tracks`
              : `${ASSESSMENTS.length} available`}
          </span>
        </div>

        <div className="arc-exam-list">
          {ASSESSMENTS.map((a) => {
            const off = !onTrack(a);
            const cls = [
              "arc-exam",
              gate.unlocked ? "is-unlocked" : "",
              off ? "is-offtrack" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <a
                href={gate.unlocked ? `/assessments/${a.id}` : undefined}
                className={cls}
                key={a.id}
                aria-disabled={!gate.unlocked}
                onClick={(e) => {
                  if (!gate.unlocked) e.preventDefault();
                }}
              >
                <span className="arc-exam-well" aria-hidden="true">
                  {gate.unlocked ? "▶" : "■"}
                </span>
                <span className="arc-exam-body">
                  <strong className="arc-exam-title">{a.title}</strong>
                  <span className="arc-exam-firm">
                    {a.firm} · {TRACK_BY_ID[a.track]?.label}
                  </span>
                  <span className="arc-exam-blurb">{a.blurb}</span>
                </span>
                <span className="arc-exam-side">
                  <span className="arc-exam-meta">{examMeta(a)}</span>
                  <span className="arc-exam-state">
                    {off ? "Off-track" : gate.unlocked ? "Start" : "Locked"}
                  </span>
                </span>
              </a>
            );
          })}
        </div>

        <p className="arc-note">
          {offTrackCount > 0
            ? `${offTrackCount} assessment${offTrackCount === 1 ? " sits" : "s sit"} on tracks you haven't selected — they're dimmed above. Add a track in your profile to bring them forward.`
            : "Showing every assessment for your selected tracks."}
        </p>
      </section>
    </>
  );
}
