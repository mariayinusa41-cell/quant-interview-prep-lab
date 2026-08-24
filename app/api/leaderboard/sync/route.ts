import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { getCurrentUser } from "../../../../lib/auth";

// Pushes the logged-in player's local ProgressContext numbers up as their
// public leaderboard row. The client stays authoritative for its own
// session (this is a sync, not a grading authority) — called after
// meaningful progress changes, not on every keystroke.
export async function POST(request: Request) {
  const me = await getCurrentUser(request);
  if (!me) return Response.json({ error: "Not signed in." }, { status: 401 });

  try {
    const payload = (await request.json()) as { tickets?: number; gradedCorrect?: number; gradedTotal?: number };
    const tickets = Math.max(0, Math.floor(Number(payload.tickets) || 0));
    const gradedCorrect = Math.max(0, Math.floor(Number(payload.gradedCorrect) || 0));
    const gradedTotal = Math.max(gradedCorrect, Math.floor(Number(payload.gradedTotal) || 0));

    const db = getDb();
    await db.update(users).set({ tickets, gradedCorrect, gradedTotal }).where(eq(users.id, me.id));

    return Response.json({ synced: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
