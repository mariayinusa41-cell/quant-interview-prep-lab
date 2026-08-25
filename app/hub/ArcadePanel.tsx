"use client";

import { useEffect, useState } from "react";
import PixelTileIcon from "../PixelTileIcon";
import DailyChallenge from "../daily/DailyChallenge";
import { LABS } from "./labs";
import { useSound } from "../audio/SoundProvider";
import { useProfile } from "../profile/ProfileContext";
import { TRACKS, type TrackId } from "../profile/tracks";

type FilterId = "all" | TrackId;

// Remembers the track filter across navigation. Without this the panel
// remounts every time you come back from a lab and re-runs its initialiser,
// which silently threw away whatever you had picked and snapped back to the
// profile's first track.
const FILTER_KEY = "outcry_lab_filter";

function isValidFilter(value: string): value is FilterId {
  return value === "all" || TRACKS.some((t) => t.id === value);
}

export default function ArcadePanel() {
  const { playSfx } = useSound();
  const { profile } = useProfile();

  // Opens on whatever the player picked first during onboarding — "your
  // first choice" — rather than always on "All". Falls back to "all" for
  // guests or anyone who picked nothing. Once they change the dropdown
  // themselves, that choice wins from then on (see the effect below).
  const [filter, setFilter] = useState<FilterId>(() => profile.tracks[0] ?? "all");

  // Restore an explicit earlier choice. Deliberately in an effect rather
  // than the useState initialiser: this component is server-rendered, so
  // reading localStorage during the first render would make the server and
  // client disagree and trip a hydration mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FILTER_KEY);
      if (saved && isValidFilter(saved)) setFilter(saved);
    } catch {
      /* storage unavailable (private mode) — keep the profile default */
    }
  }, []);

  // Only a deliberate change is persisted, so the stored value always
  // represents something the player actually chose.
  const chooseFilter = (next: FilterId) => {
    setFilter(next);
    try {
      window.localStorage.setItem(FILTER_KEY, next);
    } catch {
      /* noop */
    }
  };

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
                chooseFilter(e.target.value as FilterId);
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
