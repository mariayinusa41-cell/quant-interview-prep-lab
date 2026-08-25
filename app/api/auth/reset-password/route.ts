import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import { hashPassword } from "../../../../lib/auth";

const MIN_PASSWORD = 8;

// Complete a password reset.
//
// Three things happen together and all of them matter:
//   1. the token is checked against its expiry, so a stale link is refused;
//   2. the token is cleared, making it single-use — a reset link sitting in
//      an inbox must not keep working after it has been used;
//   3. every existing session for the account is deleted.
//
// (3) is the one that is easy to leave out. If someone reset their password
// because an attacker had gained access, leaving the attacker's session
// cookie valid would mean the reset changed nothing for them. Signing every
// device out is the entire point of the exercise.
export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return Response.json({ error: "This reset link is missing its token." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return Response.json(
      { error: `Choose a password of at least ${MIN_PASSWORD} characters.` },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.resetToken, token), gt(users.resetTokenExpiresAt, now)))
      .limit(1);

    if (!user) {
      // Covers expired, already-used and never-valid alike. Distinguishing
      // them would tell someone holding a stale token whether it was ever
      // real.
      return Response.json(
        { error: "That reset link has expired or already been used. Request a new one." },
        { status: 400 },
      );
    }

    const { hash, salt } = await hashPassword(password);

    await db
      .update(users)
      .set({
        passwordHash: hash,
        passwordSalt: salt,
        resetToken: null,
        resetTokenExpiresAt: null,
        // Completing a reset proves control of the mailbox, which is the
        // same thing verification tests — so an unverified account that
        // resets is now verified rather than being asked to prove it twice.
        emailVerifiedAt: now,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    await db.delete(sessions).where(eq(sessions.userId, user.id));

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not reset that password." }, { status: 500 });
  }
}
