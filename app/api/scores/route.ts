import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { gameScores } from "../../../db/schema";
import { getCurrentUser } from "../../../lib/auth";

// Per-game leaderboards.
//
// Boards rank each player's BEST run rather than every run. Ranking raw runs
// would put whoever replayed the most at the top, which measures persistence
// rather than skill, and would let one player occupy the entire table.

const MAX_GAME_ID = 80;
const TOP_N = 10;

type BestRow = {
  user_id: number;
  best: number;
  accuracy: number | null;
  duration_ms: number | null;
  name: string | null;
  is_pass_holder: number;
};

/** POST — record one completed run. Requires a real account. */
export async function POST(request: Request) {
  const me = await getCurrentUser(request);
  if (!me) {
    return Response.json({ error: "Sign in to record a score." }, { status: 401 });
  }

  let body: {
    gameId?: unknown;
    score?: unknown;
    accuracy?: unknown;
    durationMs?: unknown;
    meta?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const gameId = typeof body.gameId === "string" ? body.gameId.trim() : "";
  if (!gameId || gameId.length > MAX_GAME_ID) {
    return Response.json({ error: "A gameId is required." }, { status: 400 });
  }

  // Scores are client-reported, so they are range-checked rather than
  // trusted outright. This is not tamper-proof — a determined player can
  // still POST a number — but it keeps honest clients from writing junk
  // (NaN, Infinity, a float) into a ranked integer column.
  const score = Number(body.score);
  if (!Number.isFinite(score) || !Number.isInteger(score) || score < 0 || score > 1_000_000) {
    return Response.json({ error: "Score must be a whole number between 0 and 1,000,000." }, { status: 400 });
  }

  const accuracyRaw = body.accuracy === null || body.accuracy === undefined ? null : Number(body.accuracy);
  const accuracy =
    accuracyRaw === null || !Number.isFinite(accuracyRaw)
      ? null
      : Math.max(0, Math.min(100, Math.round(accuracyRaw)));

  const durationRaw = body.durationMs === null || body.durationMs === undefined ? null : Number(body.durationMs);
  const durationMs =
    durationRaw === null || !Number.isFinite(durationRaw) || durationRaw < 0
      ? null
      : Math.round(durationRaw);

  let metaJson: string | null = null;
  if (body.meta && typeof body.meta === "object") {
    const encoded = JSON.stringify(body.meta);
    // Cap it so a game can't push an unbounded blob into the row.
    metaJson = encoded.length <= 2000 ? encoded : null;
  }

  try {
    const db = getDb();
    await db.insert(gameScores).values({
      userId: me.id,
      gameId,
      score,
      accuracy,
      durationMs,
      metaJson,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not record that score." }, { status: 500 });
  }
}

/** GET ?gameId=... — top players, plus where the caller lands. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameId = (url.searchParams.get("gameId") ?? "").trim();
  if (!gameId || gameId.length > MAX_GAME_ID) {
    return Response.json({ error: "A gameId is required." }, { status: 400 });
  }

  try {
    const me = await getCurrentUser(request);
    const db = getDb();

    // One row per player: their best score at this game, with the accuracy
    // and duration from that best run (not an average across runs, which
    // would describe a run nobody actually had).
    const rows = (await db.all(sql`
      SELECT
        s.user_id,
        s.score        AS best,
        s.accuracy     AS accuracy,
        s.duration_ms  AS duration_ms,
        COALESCE(u.username, u.display_name) AS name,
        u.is_pass_holder AS is_pass_holder
      FROM game_scores s
      JOIN users u ON u.id = s.user_id
      WHERE s.game_id = ${gameId}
        AND s.score = (
          SELECT MAX(s2.score) FROM game_scores s2
          WHERE s2.user_id = s.user_id AND s2.game_id = ${gameId}
        )
      GROUP BY s.user_id
      ORDER BY best DESC, s.duration_ms IS NULL, s.duration_ms ASC, s.created_at ASC
    `)) as unknown as BestRow[];

    const totalPlayers = rows.length;
    const top = rows.slice(0, TOP_N).map((r, i) => ({
      rank: i + 1,
      name: r.name ?? "anonymous",
      score: r.best,
      accuracy: r.accuracy,
      durationMs: r.duration_ms,
      isPassHolder: r.is_pass_holder === 1,
      isYou: me ? r.user_id === me.id : false,
    }));

    let you: {
      rank: number;
      score: number;
      percentile: number;
      accuracy: number | null;
      durationMs: number | null;
    } | null = null;

    if (me) {
      const idx = rows.findIndex((r) => r.user_id === me.id);
      if (idx >= 0) {
        const mine = rows[idx];
        // "Better than X% of players", counting players strictly below you.
        // Ties don't count as beaten, so several players on the same score
        // all report the same percentile rather than one edging out the rest.
        const beaten = rows.filter((r) => r.best < mine.best).length;
        you = {
          rank: idx + 1,
          score: mine.best,
          percentile: totalPlayers > 1 ? Math.round((beaten / (totalPlayers - 1)) * 100) : 100,
          accuracy: mine.accuracy,
          durationMs: mine.duration_ms,
        };
      }
    }

    return Response.json({ gameId, top, you, totalPlayers });
  } catch {
    // An unmigrated or unreachable DB should leave the game playable, so
    // this reports an empty board rather than failing the page.
    return Response.json({ gameId, top: [], you: null, totalPlayers: 0 });
  }
}
