import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { drillRuns } from "../../../../db/schema";

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("no such table") || combined.includes("drill_runs")) {
    return "The drill_runs table is unavailable. Generate the migration locally with `npm run db:generate`, then deploy so the platform can apply the generated SQL to the real D1 database.";
  }

  return message;
}

// Records a completed Drill Lab run so it can later be pulled as a "ghost"
// for someone else to race against.
export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      mode?: string;
      durationMs?: number;
      score?: number;
      attempts?: number;
      splits?: number[];
      seed?: number;
      deckSize?: number;
      cardTimes?: number[];
    };

    const durationMs = Number(payload.durationMs);
    const score = Number(payload.score);
    const attempts = Number(payload.attempts);
    const splits = Array.isArray(payload.splits) ? payload.splits.filter((n) => Number.isFinite(n)) : [];

    if (!Number.isFinite(durationMs) || !Number.isFinite(score) || !Number.isFinite(attempts)) {
      return Response.json({ error: "durationMs, score, and attempts are required numbers" }, { status: 400 });
    }

    const db = getDb();
    const [run] = await db
      .insert(drillRuns)
      .values({
        mode: payload.mode?.trim() || "arithmetic-race",
        durationMs,
        score,
        attempts,
        splitsJson: JSON.stringify(splits),
        seed: Number.isFinite(Number(payload.seed)) ? Number(payload.seed) : null,
        deckSize: Number.isFinite(Number(payload.deckSize)) ? Number(payload.deckSize) : null,
        cardTimesJson: Array.isArray(payload.cardTimes) ? JSON.stringify(payload.cardTimes) : null,
      })
      .returning();

    return Response.json({ run }, { status: 201 });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}

// Recent runs, mostly useful for sanity-checking the table during dev.
export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(drillRuns).orderBy(desc(drillRuns.createdAt), desc(drillRuns.id)).limit(20);
    return Response.json({ runs: rows });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
