import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { gameScores, sessions, users } from "../../../../db/schema";
import { clearSessionCookieHeader, getCurrentUser, verifyPassword } from "../../../../lib/auth";

// Permanent account deletion. Two safety properties:
//
//  1. It re-verifies the password. A session cookie alone must not be enough
//     to destroy an account — a borrowed laptop or an XSS'd request should
//     hit a wall here.
//  2. It deletes the user's dependent rows first (scores, sessions), then
//     the user, so no orphaned rows point at a dead id and the email is
//     genuinely free to sign up again.

export async function POST(request: Request) {
  const me = await getCurrentUser(request);
  if (!me) return Response.json({ error: "Not signed in." }, { status: 401 });

  let payload: { password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }
  if (typeof payload.password !== "string" || payload.password.length === 0) {
    return Response.json({ error: "Enter your password to confirm." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
    if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });

    const ok = await verifyPassword(payload.password, user.passwordHash, user.passwordSalt);
    if (!ok) return Response.json({ error: "Incorrect password." }, { status: 403 });

    await db.delete(gameScores).where(eq(gameScores.userId, me.id));
    await db.delete(sessions).where(eq(sessions.userId, me.id));
    await db.delete(users).where(eq(users.id, me.id));

    // Expire the cookie so the browser stops presenting a token that now
    // points at nothing.
    return Response.json(
      { deleted: true },
      { headers: { "Set-Cookie": clearSessionCookieHeader() } },
    );
  } catch {
    return Response.json({ error: "Could not delete the account." }, { status: 500 });
  }
}
