import { and, eq, gte, isNotNull, ne, sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { drillRuns } from "../../../../../db/schema";

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("no such table") || combined.includes("drill_runs")) {
    return "The drill_runs table is unavailable. Generate the migration locally with `npm run db:generate`, then deploy so the platform can apply the generated SQL to the real D1 database.";
  }

  return message;
}

// Pulls one real, previously-recorded run at random to race against as a
// "ghost." Filters out very short runs (fewer than 3 attempts) so you're not
// racing noise, and can exclude the run you just submitted yourself.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const excludeId = Number(url.searchParams.get("excludeId"));

    const db = getDb();
    // Only race-format rows can be raced: a ghost is unusable without the
    // seed (to rebuild its deck) and per-card times (to know when it took
    // each card). Older/solo-format rows are filtered out here rather than
    // failing later in the client.
    const conditions = [
      gte(drillRuns.attempts, 3),
      eq(drillRuns.mode, "arithmetic-race"),
      isNotNull(drillRuns.seed),
      isNotNull(drillRuns.cardTimesJson),
    ];
    if (Number.isFinite(excludeId) && excludeId > 0) {
      conditions.push(ne(drillRuns.id, excludeId));
    }

    const [run] = await db
      .select()
      .from(drillRuns)
      .where(and(...conditions))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return Response.json({ run: run ?? null });
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
