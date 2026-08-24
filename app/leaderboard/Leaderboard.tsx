"use client";

import { useState } from "react";
import { useProgress } from "../progress/ProgressContext";
import { useProfile } from "../profile/ProfileContext";
import { AvatarSprite, type AvatarId } from "../profile/avatars";

// There is no server, so there are no other real players to rank against.
// These are clearly-labelled sample rows that exist to show the shape of the
// board; only the "you" row is real data.
type Row = { name: string; avatar: AvatarId; tickets: number; accuracy: number; sample: boolean };

const SAMPLE_ROWS: Row[] = [
  { name: "vega_hunter", avatar: "robot", tickets: 1840, accuracy: 91, sample: true },
  { name: "brownianbee", avatar: "bird", tickets: 1622, accuracy: 88, sample: true },
  { name: "delta_duck", avatar: "duck", tickets: 1470, accuracy: 84, sample: true },
  { name: "ruinwalker", avatar: "frog", tickets: 1210, accuracy: 79, sample: true },
  { name: "kellycrit", avatar: "cat", tickets: 980, accuracy: 77, sample: true },
  { name: "pnl_pig", avatar: "pig", tickets: 742, accuracy: 71, sample: true },
  { name: "greenbook", avatar: "monster", tickets: 511, accuracy: 66, sample: true },
  { name: "queen_of_ev", avatar: "princess", tickets: 305, accuracy: 63, sample: true },
];

type SortKey = "tickets" | "accuracy";

export default function Leaderboard() {
  const { tickets, accuracy } = useProgress();
  const { profile } = useProfile();
  const [sort, setSort] = useState<SortKey>("tickets");

  const you: Row = {
    name: profile.displayName.trim() || (profile.account === "guest" ? "you (guest)" : "you"),
    avatar: profile.avatar,
    tickets,
    accuracy: accuracy ?? 0,
    sample: false,
  };

  const rows = [...SAMPLE_ROWS, you].sort((a, b) =>
    sort === "tickets" ? b.tickets - a.tickets : b.accuracy - a.accuracy,
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

      <ol className="lb-list">
        {rows.map((row, i) => (
          <li key={`${row.name}-${i}`} className={row.sample ? "lb-row" : "lb-row is-you"}>
            <span className="lb-rank">{i + 1}</span>
            <span className="lb-avatar"><AvatarSprite id={row.avatar} /></span>
            <span className="lb-name">
              {row.name}
              {!row.sample && <span className="lb-you-tag">YOU</span>}
            </span>
            <span className="lb-tickets">{row.tickets}</span>
            <span className="lb-acc">{row.accuracy}%</span>
          </li>
        ))}
      </ol>

      <p className="assess-footnote">
        Sample opponents — there is no server yet, so every row except yours is placeholder data.
      </p>
    </section>
  );
}
