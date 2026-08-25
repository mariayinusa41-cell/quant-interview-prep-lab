"use client";

import { useAccess } from "./AccessContext";
import { useProgress } from "../progress/ProgressContext";
import TokenIcon from "./TokenIcon";
import TicketIcon from "../progress/TicketIcon";
import { useSound } from "../audio/SoundProvider";
import ThemePicker from "../theme/ThemePicker";

export default function AccessHud() {
  const { mode, tokens } = useAccess();
  const { tickets, accuracy } = useProgress();
  const { muted, toggleMute } = useSound();

  return (
    <>
      <div className="access-hud" aria-label="Player status">
        {mode !== "developer" && (
          <span className="access-hud-mode">{mode === "free" ? "FREE" : "INFINITY PASS"}</span>
        )}

        {/* Tokens: currency, and only free users have a balance to spend. */}
        {mode === "free" && (
          <span className="access-hud-balance">
            <TokenIcon />
            <strong>{tokens}</strong>
          </span>
        )}
        {mode === "infinity" && (
          <span className="access-hud-balance">
            <span className="access-infinity-mark" aria-hidden="true">INF</span>
          </span>
        )}
        {mode === "free" && (
          <a href="/pricing" className="access-plus" aria-label="Get more tokens on the pricing page">
            +
          </a>
        )}

        <span className="access-hud-divider" aria-hidden="true" />

        {/* Tickets: lifetime correct answers. Never decreases. */}
        <span className="access-hud-balance" title="Tickets - one per question answered correctly">
          <TicketIcon />
          <strong>{tickets}</strong>
        </span>

        {/* Accuracy: share of graded questions answered correctly. */}
        <span className="hud-accuracy" title="Accuracy - correct answers as a share of questions graded">
          <span className="hud-accuracy-label">ACC</span>
          <span className="hud-accuracy-bar" role="img" aria-label={accuracy === null ? "No accuracy yet" : `Accuracy ${accuracy} percent`}>
            <span
              className="hud-accuracy-fill"
              data-band={accuracy === null ? "none" : accuracy >= 80 ? "high" : accuracy >= 55 ? "mid" : "low"}
              style={{ width: `${accuracy ?? 0}%` }}
            />
          </span>
          <strong>{accuracy === null ? "--" : `${accuracy}%`}</strong>
        </span>

        <button
          type="button"
          className={muted ? "hud-mute is-muted" : "hud-mute"}
          onClick={toggleMute}
          aria-pressed={!muted}
          title={muted ? "Unmute arcade music" : "Mute arcade music"}
        >
          {muted ? "♪̸" : "♪"}
          <span className="sr-only">{muted ? "Unmute" : "Mute"}</span>
        </button>

        <ThemePicker />
      </div>
    </>
  );
}
