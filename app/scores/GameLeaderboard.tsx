"use client";

import { useEffect, useRef, useState } from "react";
import { getGameLimit } from "../../lib/gameLimits";
import { recordRun } from "../progress/lastRun";

// Drop-in end-of-run leaderboard. A game renders this on its game-over
// screen with the score it just produced; the component submits that run
// once, then shows the board and where the player landed.
//
// Deliberately non-blocking: a signed-out player, an unmigrated table or a
// failed request all degrade to "no board" rather than breaking the results
// screen a player just earned.

type Entry = {
  rank: number;
  name: string;
  score: number;
  accuracy: number | null;
  durationMs: number | null;
  isPassHolder: boolean;
  isYou: boolean;
};

type You = {
  rank: number;
  score: number;
  percentile: number;
  accuracy: number | null;
  durationMs: number | null;
};

type Board = { top: Entry[]; you: You | null; totalPlayers: number };

function formatDuration(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms)) return null;
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

/** "Top 5%" reads better than "95th percentile" when you did well. */
function placementLabel(percentile: number, rank: number, total: number): string {
  if (total <= 1) return "First score on the board";
  if (rank === 1) return "Best score on the board";
  if (percentile >= 90) return `Top ${Math.max(1, 100 - percentile)}%`;
  return `Better than ${percentile}% of players`;
}

export default function GameLeaderboard({
  gameId,
  score,
  accuracy = null,
  durationMs = null,
  meta,
  title = "Leaderboard",
}: {
  gameId: string;
  score: number;
  accuracy?: number | null;
  durationMs?: number | null;
  meta?: Record<string, unknown>;
  title?: string;
}) {
  const [board, setBoard] = useState<Board | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  // A results screen can re-render for all sorts of reasons; the run itself
  // must only ever be recorded once.
  const submitted = useRef(false);

  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;

    // This component already sits on every results screen and already knows
    // the game and the score, so recording the run here wires the profile's
    // CONTINUE? panel for every game with a board at once, instead of
    // editing each game's end screen separately.
    const limit = getGameLimit(gameId);
    if (limit?.href) {
      recordRun({
        game: limit.label,
        href: limit.href,
        score,
        // Bankroll games rank on profit and have no meaningful maximum, so
        // the panel shows a bare number rather than "x / y" for those.
        total: limit.unit === "dollars" ? null : limit.maxScore,
      });
    }

    let cancelled = false;

    (async () => {
      let signedOut = false;
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, score, accuracy, durationMs, meta }),
        });
        if (res.status === 401) signedOut = true;
      } catch {
        /* offline or blocked — still try to show the board below */
      }

      try {
        const res = await fetch(`/api/scores?gameId=${encodeURIComponent(gameId)}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as Board;
        if (cancelled) return;
        setBoard(data);
        setState(signedOut ? "signed-out" : "ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  if (state === "error") return null;

  return (
    <section className="gl-panel" aria-label={`${title} for this game`}>
      <p className="gl-title">{title}</p>

      {state === "signed-out" && (
        <p className="gl-signedout">
          <a href="/login">Sign in</a> to put this score on the board.
        </p>
      )}

      {state === "loading" && <p className="gl-empty">Loading the board...</p>}

      {board && board.you && (
        <div className="gl-you">
          <span className="gl-you-place">{placementLabel(board.you.percentile, board.you.rank, board.totalPlayers)}</span>
          <span className="gl-you-meta">
            Rank {board.you.rank} of {board.totalPlayers}
            {board.you.score !== score && <> &middot; personal best {board.you.score}</>}
          </span>
        </div>
      )}

      {board && board.top.length > 0 ? (
        <ol className="gl-list">
          {board.top.map((e) => (
            <li key={`${e.rank}-${e.name}`} className={e.isYou ? "gl-row is-you" : "gl-row"}>
              <span className="gl-rank">{e.rank}</span>
              <span className={e.isPassHolder ? "gl-name is-pass" : "gl-name"}>{e.name}</span>
              <span className="gl-stats">
                {e.accuracy !== null && <span className="gl-acc">{e.accuracy}%</span>}
                {formatDuration(e.durationMs) && <span className="gl-time">{formatDuration(e.durationMs)}</span>}
                <strong className="gl-score">{e.score}</strong>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        state !== "loading" && <p className="gl-empty">No scores yet. Yours would be the first.</p>
      )}
    </section>
  );
}
