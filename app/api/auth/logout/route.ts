import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions } from "../../../../db/schema";
import { clearSessionCookieHeader, parseSessionCookie } from "../../../../lib/auth";

export async function POST(request: Request) {
  const token = parseSessionCookie(request);
  if (token) {
    try {
      const db = getDb();
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch {
      // Session row already gone or the table is unavailable — either way
      // the client cookie still gets cleared below, so this isn't fatal.
    }
  }
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookieHeader() } });
}
