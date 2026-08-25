"use client";

import { useEffect, useState } from "react";
import PixelTileIcon from "../PixelTileIcon";
import { LABS } from "./labs";
import { useSound } from "../audio/SoundProvider";
import { useProfile } from "../profile/ProfileContext";
import { useAccess } from "../access/AccessContext";
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
  const { getSessionCost, isFreeGame, isPremiumOnly } = useAccess();

  // Opens on whatever the player picked first during onboarding — "your
  // first choice" — rather than always on "All". Falls back to "all" for
  // guests or anyone who picked nothing. Once they change the filter
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
    playSfx("select");
    try {
      window.localStorage.setItem(FILTER_KEY, next);
    } catch {
      /* noop */
    }
  };

  const visibleLabs = filter === "all" ? LABS : LABS.filter((lab) => lab.tracks.includes(filter));
  const activeTrackLabel = TRACKS.find((t) => t.id === filter)?.label;

  // Real token price, read from the same access config that actually charges
  // the player — not a number re-declared here. A lab holds several games at
  // different prices, so this is the range across them.
  //
  // Pass-only games have to be called out separately rather than folded into
  // the range: getSessionCost() happily returns the default 10 for them, so
  // treating them as priced would advertise Algorithm Arena at "0–10" when
  // most of it can't be bought with tokens at any price.
  const costLabel = (gameIds: string[]) => {
    if (gameIds.length === 0) return null;

    const passOnly = gameIds.filter((id) => isPremiumOnly(id) && !isFreeGame(id));
    const buyable = gameIds.filter((id) => !isPremiumOnly(id) || isFreeGame(id));
    const prices = buyable.map((id) => (isFreeGame(id) ? 0 : getSessionCost(id)));

    if (prices.length === 0) {
      return { text: "Pass only", free: false };
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const base = max === 0 ? "Free" : min === max ? `${min}` : `${min}-${max}`;
    return {
      text: passOnly.length > 0 ? `${base} / Pass` : base,
      free: max === 0 && passOnly.length === 0,
    };
  };

  return (
    <div className="hub-panel">
      <section className="section">
        <div className="arc-head-row">
          <h2>Cabinet floor</h2>
          <span className="arc-count">
            {filter === "all"
              ? `${LABS.length} labs · every cabinet on the floor`
              : `${visibleLabs.length} of ${LABS.length} labs · recommended for ${activeTrackLabel}`}
          </span>
        </div>
        <p className="arc-intro">
          Every cabinet shows what it costs to play, so you pick a lab on purpose instead of by title.
        </p>

        <div className="arc-chip-row" role="group" aria-label="Filter labs by track">
          <button
            type="button"
            className={filter === "all" ? "arc-chip is-on" : "arc-chip"}
            aria-pressed={filter === "all"}
            onClick={() => chooseFilter("all")}
          >
            All labs
          </button>
          {TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              className={filter === track.id ? "arc-chip is-on" : "arc-chip"}
              aria-pressed={filter === track.id}
              onClick={() => chooseFilter(track.id)}
            >
              {track.label}
            </button>
          ))}
        </div>

        <div className="arc-cab-grid">
          {visibleLabs.map((lab) => {
            const cost = costLabel(lab.gameIds);
            return (
              <a
                href={lab.href}
                className="arc-cab"
                key={lab.href}
                onMouseEnter={() => playSfx("select")}
                onClick={() => playSfx("confirm")}
              >
                <span className={`arc-cab-marquee tone-${lab.tone}`}>
                  <span className="arc-cab-icon" aria-hidden="true">
                    <PixelTileIcon kind={lab.icon} tone={lab.tone} />
                  </span>
                  <span className="arc-cab-tag">{lab.tag}</span>
                </span>
                <span className="arc-cab-body">
                  <strong className="arc-cab-title">{lab.title}</strong>
                  <span className="arc-cab-desc">{lab.desc}</span>
                  <span className="arc-cab-foot">
                    <span>
                      COST{" "}
                      <strong className={cost?.free ? "is-free" : "is-cost"}>{cost ? cost.text : "-"}</strong>
                    </span>
                    <span>
                      PAYS <strong className="is-pays">1 / correct</strong>
                    </span>
                    <span className="arc-cab-play">PLAY &#9654;</span>
                  </span>
                </span>
              </a>
            );
          })}
          {visibleLabs.length === 0 && <p className="lab-filter-empty">No labs tagged for this track yet.</p>}
        </div>
      </section>
    </div>
  );
}
