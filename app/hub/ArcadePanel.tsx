"use client";

import { useState } from "react";
import PixelTileIcon from "../PixelTileIcon";
import DailyChallenge from "../daily/DailyChallenge";
import { LABS } from "./labs";
import { useSound } from "../audio/SoundProvider";
import { useProfile } from "../profile/ProfileContext";
import { TRACKS, type TrackId } from "../profile/tracks";

type FilterId = "all" | TrackId;

export default function ArcadePanel() {
  const { playSfx } = useSound();
  const { profile } = useProfile();

  // Defaults to whatever the player picked first during onboarding — "your
  // first choice" — rather than always opening on "All". Falls back to "all"
  // for guests or anyone who picked nothing.
  const [filter, setFilter] = useState<FilterId>(() => profile.tracks[0] ?? "all");

  const visibleLabs = filter === "all" ? LABS : LABS.filter((lab) => lab.tracks.includes(filter));

  return (
    <div className="hub-panel">
      <DailyChallenge />

      <section className="section">
        <div className="lab-filter-row">
          <h2 className="lab-filter-title">Choose your lab</h2>
          <label className="lab-filter-select-wrap">
            <span className="lab-filter-label">Recommended for</span>
            <select
              className="lab-filter-select"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as FilterId);
                playSfx("select");
              }}
            >
              <option value="all">All labs</option>
              {TRACKS.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filter !== "all" && (
          <p className="lab-filter-note">
            Showing labs recommended for {TRACKS.find((t) => t.id === filter)?.label} —{" "}
            {visibleLabs.length} of {LABS.length}. A game living outside this filter still counts toward every
            track's readiness a little, it just weights less; nothing here is actually hidden from you elsewhere.
          </p>
        )}

        <div className="lab-link-list">
          {visibleLabs.map((lab) => (
            <a
              href={lab.href}
              className="lab-link-row"
              key={lab.href}
              onMouseEnter={() => playSfx("select")}
              onClick={() => playSfx("confirm")}
            >
              <span className="teaser-tile-icon" aria-hidden="true">
                <PixelTileIcon kind={lab.icon} tone={lab.tone} />
              </span>
              <span className="teaser-tile-tag">{lab.tag}</span>
              <span className="teaser-tile-title">{lab.title}</span>
              <span className="teaser-tile-desc">{lab.desc}</span>
              <span className="teaser-tile-cta">Play &rarr;</span>
            </a>
          ))}
          {visibleLabs.length === 0 && <p className="lab-filter-empty">No labs tagged for this track yet.</p>}
        </div>
      </section>
    </div>
  );
}
