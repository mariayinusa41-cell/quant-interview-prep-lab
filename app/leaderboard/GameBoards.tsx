"use client";

import { useEffect, useState } from "react";

// Per-game standings, sourced from the same /api/scores the end-of-run
// panel uses. Only games that actually have a board are listed, and only
// ones with at least one score are shown — an empty table reads as broken
// rather than as new.

const BOARDS: { gameId: string; label: string; unit: "points" | "profit" }[] = [
  { gameId: "drills-fermi-classic", label: "Fermi Estimation", unit: "points" },
  { gameId: "drills-fermi-technical", label: "Technical Estimation", unit: "points" },
  { gameId: "drills-probability-ranking", label: "Likelihood Ranking", unit: "points" },
  { gameId: "probability-casino-dice-ev-lab", label: "Dice EV Lab", unit: "points" },
  { gameId: "statistics-read-the-shape", label: "Read the Shape", unit: "points" },
  { gameId: "statistics-twenty-backtests", label: "Twenty Backtests", unit: "points" },
  { gameId: "statistics-crack-the-bot", label: "Crack the Bot", unit: "points" },
  { gameId: "stochastic-ruin-walker", label: "Ruin Walker", unit: "profit" },
  { gameId: "finance-market-maker", label: "Market Maker", unit: "profit" },
];

type Entry = { rank: number; name: string; score: number; isPassHolder: boolean; isYou: boolean };
type Board = { top: Entry[]; totalPlayers: number };

export default function GameBoards() {
  const [active, setActive] = useState(BOARDS[0].gameId);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/scores?gameId=${encodeURIComponent(active)}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as Board;
        if (!cancelled) setBoard(data);
      } catch {
        if (!cancelled) setBoard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [active]);

  const current = BOARDS.find((b) => b.gameId === active);

  return (
    <section className="gl-panel" style={{ maxWidth: 560, marginTop: 26 }}>
      <p className="gl-title">Per-game boards</p>

      <div className="news-filter-row">
        {BOARDS.map((b) => (
          <button
            key={b.gameId}
            type="button"
            className={active === b.gameId ? "news-chip is-active" : "news-chip"}
            onClick={() => setActive(b.gameId)}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading && <p className="gl-empty">Loading...</p>}

      {!loading && board && board.top.length > 0 && (
        <>
          <ol className="gl-list">
            {board.top.map((e) => (
              <li key={`${e.rank}-${e.name}`} className={e.isYou ? "gl-row is-you" : "gl-row"}>
                <span className="gl-rank">{e.rank}</span>
                <span className={e.isPassHolder ? "gl-name is-pass" : "gl-name"}>{e.name}</span>
                <span className="gl-stats">
                  <strong className="gl-score">
                    {/* Profit boards can be negative, and "-210 points" would
                        read as a scoring bug rather than a losing session. */}
                    {current?.unit === "profit"
                      ? `${e.score < 0 ? "-" : ""}$${Math.abs(e.score)}`
                      : e.score}
                  </strong>
                </span>
              </li>
            ))}
          </ol>
          <p className="gl-empty" style={{ marginTop: 8 }}>
            {board.totalPlayers} player{board.totalPlayers === 1 ? "" : "s"} ranked
          </p>
        </>
      )}

      {!loading && (!board || board.top.length === 0) && (
        <p className="gl-empty">
          No scores on this board yet. Finish a run of {current?.label} and you&rsquo;ll be first.
        </p>
      )}
    </section>
  );
}
