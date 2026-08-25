"use client";

import { useProfile } from "../profile/ProfileContext";
import { useProgress } from "../progress/ProgressContext";
import { TRACKS } from "../profile/tracks";
import { SKILL_LABELS } from "../progress/skills";
import { trackGaps, trackReadiness } from "../progress/progression";

// Only the tracks the player actually chose.
//
// The design called for a card per entry in TRACKS, which would show an
// aspiring actuary their Quant Dev readiness — a number they have no reason
// to care about, sitting next to the one they do. Showing six cards to
// answer one question makes the answer harder to find, so this follows the
// player's own selection from onboarding.
export default function TrackReadiness() {
  const { profile } = useProfile();
  const { skills } = useProgress();

  const chosen = TRACKS.filter((t) => profile.tracks.includes(t.id));

  // Someone who skipped track selection still gets something useful rather
  // than an empty panel.
  if (chosen.length === 0) {
    return (
      <section className="section">
        <h2>Track readiness</h2>
        <p className="section-intro">
          Pick the roles you&rsquo;re aiming for and this will show how ready you are for each.{" "}
          <a href="/?login=1">Choose your tracks</a>.
        </p>
      </section>
    );
  }

  return (
    <section className="section">
      <h2>Track readiness</h2>
      <p className="section-intro">
        Weighted by each track&rsquo;s core skills - the same weighting the labs already use.
      </p>

      <div className="track-grid">
        {chosen.map((track) => {
          const pct = trackReadiness(skills, track.coreSkills);
          const band = pct >= 70 ? "is-strong" : pct >= 50 ? "is-mid" : "is-weak";
          const gaps = trackGaps(skills, track.coreSkills);
          const filled = Math.round(pct / 10);

          return (
            <div className="track-card" key={track.id}>
              <div className="track-card-head">
                <span className="track-card-name">{track.label}</span>
                <span className={`track-card-pct ${band}`}>{pct}%</span>
              </div>

              <div className="track-gauge" aria-label={`${pct} percent ready`}>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className={i < filled ? `track-block is-on ${band}` : "track-block"} />
                ))}
              </div>

              <p className="track-card-note">
                {pct >= 90
                  ? "Core skills are covered. Keep them warm."
                  : `${gaps.map((g) => SKILL_LABELS[g]).join(" and ")} ${gaps.length > 1 ? "are" : "is"} the gap.`}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
