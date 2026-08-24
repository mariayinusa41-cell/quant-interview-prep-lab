import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { users } from "../../../db/schema";
import { getCurrentUser } from "../../../lib/auth";

// Public — no auth required to view. Only rows with at least one ticket
// show up, so a fresh account with zero progress doesn't clutter the board.
export async function GET(request: Request) {
  try {
    const me = await getCurrentUser(request);

    const db = getDb();
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        tickets: users.tickets,
        gradedCorrect: users.gradedCorrect,
        gradedTotal: users.gradedTotal,
        isPassHolder: users.isPassHolder,
      })
      .from(users)
      .orderBy(desc(users.tickets))
      .limit(50);

    // `isYou` is computed here, against the real account id from the
    // session cookie — not left for the client to guess by comparing
    // display strings, which breaks the moment someone's username and
    // displayName differ (exactly the bug this replaced).
    const leaderboard = rows
      .filter((r) => r.tickets > 0)
      .map((r) => ({
        name: r.username ?? r.displayName ?? "anonymous",
        tickets: r.tickets,
        accuracy: r.gradedTotal > 0 ? Math.round((r.gradedCorrect / r.gradedTotal) * 100) : null,
        isPassHolder: r.isPassHolder === 1,
        isYou: me ? r.id === me.id : false,
      }));

    return Response.json({ leaderboard });
  } catch {
    // Tables not migrated yet, or DB unavailable — empty board, not a 500,
    // since this route gets polled by an unauthenticated public page.
    return Response.json({ leaderboard: [] });
  }
}
