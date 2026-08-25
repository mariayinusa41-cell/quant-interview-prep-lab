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

  // The podium is the top three of exactly the rows the table renders — one
  // source of truth, so #1's avatar on the plinth can never disagree with
  // #1's avatar in the table below it.
  const podium = sorted.slice(0, 3);
  // Display order is 2nd · 1st · 3rd so the tallest column sits in the middle.
  const plinthOrder = [1, 0, 2].filter((i) => i < podium.length);

  // "You are #7 — 12 tickets off #6". Only meaningful when there is somebody
  // above you, so it is omitted at #1 and when you aren't on the board.
  const youIndex = sorted.findIndex((r) => r.isYou);
  const above = youIndex > 0 ? sorted[youIndex - 1] : null;
  const gap =
    above && sort === "tickets"
      ? above.tickets - sorted[youIndex].tickets
      : above && above.accuracy !== null && sorted[youIndex].accuracy !== null
        ? above.accuracy - (sorted[youIndex].accuracy ?? 0)
        : null;

  const avatarFor = (row: LeaderboardRow) => (row.isYou ? profile.avatar : "duck");

  return (
    <>
      <section className="arc-hero" aria-label="High scores">
        <div className="arc-hero-body">
          <p className="arc-podium-title">High scores</p>
          <p className="arc-podium-sub">Real accounts only · updated live</p>

          {podium.length > 0 && (
            <div className="arc-podium">
              {plinthOrder.map((i) => {
                const row = podium[i];
                const height = i === 0 ? 124 : i === 1 ? 96 : 78;
                return (
                  <div
                    key={`${row.name}-${i}`}
                    className={i === 0 ? "arc-plinth is-first" : "arc-plinth"}
                    style={{ minHeight: height }}
                  >
                    <span className="arc-plinth-rank">{i + 1}</span>
                    <span className="arc-plinth-avatar" aria-hidden="true">
                      <AvatarSprite id={avatarFor(row)} />
                    </span>
                    <span className="arc-plinth-name">{row.name}</span>
                    <span className="arc-plinth-tickets">{row.tickets}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="arc-lb-toolbar" role="group" aria-label="Sort leaderboard">
          <button
            type="button"
            className={sort === "tickets" ? "arc-chip is-on" : "arc-chip"}
            onClick={() => setSort("tickets")}
            aria-pressed={sort === "tickets"}
          >
            Most tickets
          </button>
          <button
            type="button"
            className={sort === "accuracy" ? "arc-chip is-on" : "arc-chip"}
            onClick={() => setSort("accuracy")}
            aria-pressed={sort === "accuracy"}
          >
            Highest accuracy
          </button>
          {youIndex > 0 && gap !== null && gap > 0 && (
            <span className="arc-lb-gap">
              You are <strong>#{youIndex + 1}</strong> — {gap}
              {sort === "tickets" ? ` ticket${gap === 1 ? "" : "s"}` : ` point${gap === 1 ? "" : "s"}`} off #
              {youIndex}.
            </span>
          )}
        </div>

        {loaded && rows.length === 0 && (
          <p className="arc-note" style={{ marginTop: 0, marginBottom: 12 }}>
            No other synced accounts yet — be the first real row.
          </p>
        )}

        <div className="arc-lb-head" aria-hidden="true">
          <span>Rank</span>
          <span className="arc-lb-avatar-h" />
          <span>Player</span>
          <span>Tickets</span>
          <span>Acc</span>
        </div>

        <ol className="arc-lb-list">
          {sorted.map((row, i) => (
            <li key={`${row.name}-${i}`} className={row.isYou ? "arc-lb-row is-you" : "arc-lb-row"}>
              <span className={i < 3 ? "arc-lb-rank is-top" : "arc-lb-rank"}>{i + 1}</span>
              <span className="arc-lb-avatar" aria-hidden="true">
                <AvatarSprite id={avatarFor(row)} />
              </span>
              <span className="arc-lb-player">
                {row.isPassHolder && <PixelDiamond size={12} />}
                <span className={row.isPassHolder ? "arc-lb-name is-pass" : "arc-lb-name"}>{row.name}</span>
                {row.isYou && <span className="arc-lb-youtag">YOU</span>}
              </span>
              <span className="arc-lb-tickets">{row.tickets}</span>
              <span className="arc-lb-acc">{row.accuracy === null ? "—" : `${row.accuracy}%`}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
