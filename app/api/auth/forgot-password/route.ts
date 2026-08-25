import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { generateResetToken, isValidEmail, newResetExpiry, normalizeEmail } from "../../../../lib/auth";
import { sendPasswordResetEmail } from "../../../../lib/email";

// Start a password reset.
//
// This route ALWAYS reports the same success, whether or not the address has
// an account. Saying "no account with that email" turns the endpoint into an
// oracle for checking who is registered here, which is exactly the kind of
// list that gets used for credential stuffing elsewhere. The cost is that a
// typo looks like success; the email itself is where the user finds out.
export async function POST(request: Request) {
  // Deliberately identical for every outcome below.
  const ok = () =>
    Response.json({
      ok: true,
      message: "If that email has an account, a reset link is on its way.",
    });

  let body: { email?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  if (!isValidEmail(rawEmail)) {
    // A malformed address cannot belong to anyone, but this still returns
    // the generic success so the shape of the response never varies.
    return ok();
  }

  const email = normalizeEmail(rawEmail);

  try {
    const db = getDb();
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        resetTokenExpiresAt: users.resetTokenExpiresAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return ok();

    // Throttle: if a live token was issued in the last two minutes, do not
    // issue another. Without this the endpoint is a way to have someone's
    // inbox flooded by anyone who knows their address.
    if (user.resetTokenExpiresAt) {
      const issuedAt = new Date(user.resetTokenExpiresAt).getTime() - 60 * 60 * 1000;
      if (Date.now() - issuedAt < 2 * 60 * 1000) return ok();
    }

    const token = generateResetToken();
    await db
      .update(users)
      .set({ resetToken: token, resetTokenExpiresAt: newResetExpiry() })
      .where(eq(users.id, user.id));

    const origin = new URL(request.url).origin;
    // Sent to the address stored on the account, never to whatever was typed
    // in — otherwise a lookup that matched loosely could mail a reset link
    // to a different mailbox than the one that owns the account.
    await sendPasswordResetEmail(user.email, `${origin}/reset-password?token=${token}`);

    return ok();
  } catch {
    // Even a database failure returns the same shape, for the same reason.
    return ok();
  }
}
