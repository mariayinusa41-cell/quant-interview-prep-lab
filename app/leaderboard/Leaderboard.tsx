"use client";

import { useEffect, useState } from "react";
import { useProgress } from "../progress/ProgressContext";
import { useProfile } from "../profile/ProfileContext";
import { AvatarSprite } from "../profile/avatars";
import PixelDiamond from "./PixelDiamond";

// Real accounts only — no sample/placeholder rows. A row exists here iff a
// real signed-in user has synced at least one ticket (app/progress/
// ProgressContext.tsx pushes to app/api/leaderboard/sync on every change).
// Guests and players who haven't made an account yet just don't appear;
// their local "you" row still renders below the real board so they can see
// their own numbers without pretending they're ranked against anyone.
//
// `isYou` is computed server-side (app/api/leaderboard/route.ts) against
// the real session's account id — not by comparing display strings, which
// broke the moment an account's username and displayName differed.
type LeaderboardRow = { name: string; tickets: number; accuracy: number | null; isPassHolder: boolean; isYou: boolean };

type SortKey = "tickets" | "accuracy";

export default function Leaderboard() {
  const { tickets, accuracy } = useProgress();
  const { profile } = useProfile();
  const [sort, setSort] = useState<SortKey>("tickets");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { leaderboard: [] }))
      .then((data: { leaderboard: LeaderboardRow[] }) => setRows(data.leaderboard ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoaded(true));
  }, []);

  const youName = profile.displayName.trim() || (profile.account === "guest" ? "you (guest)" : "you");
  const hasRealYouRow = rows.some((r) => r.isYou);
  const combined = hasRealYouRow
    ? rows
    : [...rows, { name: youName, tickets, accuracy: accuracy ?? null, isPassHolder: false, isYou: true }];

  const sorted = [...combined].sort((a, b) =>
    sort === "tickets" ? b.tickets - a.tickets : (b.accuracy ?? -1) - (a.accuracy ?? -1),
  );

  return (
    <section className="section">
      <h2>Leaderboard</h2>
      <p className="section-intro">Ranked by volume or by reliability — they reward different things.</p>

      <div className="lb-tabs" role="group" aria-label="Sort leaderboard">
        <button
          type="button"
          className={sort === "tickets" ? "lb-tab is-on" : "lb-tab"}
          onClick={() => setSort("tickets")}
          aria-pressed={sort === "tickets"}
        >
          Most tickets
        </button>
        <button
          type="button"
          className={sort === "accuracy" ? "lb-tab is-on" : "lb-tab"}
          onClick={() => setSort("accuracy")}
          aria-pressed={sort === "accuracy"}
        >
          Highest accuracy
        </button>
      </div>

      {loaded && rows.length === 0 && (
        <p className="assess-footnote" style={{ marginBottom: 12 }}>
          No other synced accounts yet — be the first real row.
        </p>
      )}

      <ol className="lb-list">
        {sorted.map((row, i) => (
          <li key={`${row.name}-${i}`} className={row.isYou ? "lb-row is-you" : "lb-row"}>
            <span className="lb-rank">{i + 1}</span>
            <span className="lb-avatar">
              <AvatarSprite id={row.isYou ? profile.avatar : "duck"} />
            </span>
            <span className={row.isPassHolder ? "lb-name is-pass-holder" : "lb-name"}>
              {row.isPassHolder && <PixelDiamond size={14} />}
              {row.name}
              {row.isYou && <span className="lb-you-tag">YOU</span>}
            </span>
            <span className="lb-tickets">{row.tickets}</span>
            <span className="lb-acc">{row.accuracy === null ? "—" : `${row.accuracy}%`}</span>
          </li>
        ))}
      </ol>

      <p className="assess-footnote">
        Real accounts only — a row appears once someone signs in and earns at least one ticket. Gold names are paid
        pass holders.
      </p>
    </section>
  );
}
