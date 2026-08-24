import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";

// A plain GET so the link in the email can be clicked directly, no JS
// required. Redirects back to the site with a query flag either way, rather
// than rendering its own page, so there's one visual home for "verified"
// and "that link didn't work" instead of two.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const redirectBase = url.origin;

  if (!token) {
    return Response.redirect(`${redirectBase}/?verify=missing`, 302);
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.verificationToken, token), gt(users.verificationTokenExpiresAt, now)))
      .limit(1);

    if (!user) {
      return Response.redirect(`${redirectBase}/?verify=invalid`, 302);
    }

    await db
      .update(users)
      .set({ emailVerifiedAt: now, verificationToken: null, verificationTokenExpiresAt: null })
      .where(eq(users.id, user.id));

    return Response.redirect(`${redirectBase}/?verify=ok`, 302);
  } catch {
    return Response.redirect(`${redirectBase}/?verify=error`, 302);
  }
}
