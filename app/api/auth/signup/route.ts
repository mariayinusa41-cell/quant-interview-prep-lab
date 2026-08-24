import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import {
  generateSessionToken,
  generateVerificationToken,
  hashPassword,
  isValidEmail,
  isValidUsername,
  newSessionExpiry,
  newVerificationExpiry,
  normalizeEmail,
  normalizeEmailForUniqueness,
  setSessionCookieHeader,
} from "../../../../lib/auth";
import { sendVerificationEmail } from "../../../../lib/email";

function toRouteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const detail = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${detail}`;

  if (combined.includes("no such table") || combined.includes("users") || combined.includes("sessions")) {
    return "The users/sessions tables are unavailable. Generate the migration locally with `npm run db:generate`, then deploy so the platform can apply it to the real D1 database.";
  }
  return message;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      email?: string;
      password?: string;
      username?: string;
      displayName?: string;
    };
    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";
    const username = (payload.username ?? "").trim();
    const displayName = (payload.displayName ?? "").trim();

    if (!isValidEmail(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (username && !isValidUsername(username)) {
      return Response.json(
        { error: "Username must be 3-24 characters: letters, numbers, underscore, dot, or hyphen." },
        { status: 400 }
      );
    }

    const db = getDb();
    const [existingEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail) {
      return Response.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    // Catches the alias trick that plain email uniqueness misses —
    // foo+1@gmail.com and f.o.o@gmail.com are the same inbox as
    // foo@gmail.com, and each "verifies" independently, which is how the
    // free-tier welcome tokens would get farmed. The DB has a unique index
    // on this column too, so a race between two simultaneous signups still
    // ends with exactly one account rather than relying on this check
    // winning.
    const emailNormalized = normalizeEmailForUniqueness(email);
    const [existingNormalized] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.emailNormalized, emailNormalized))
      .limit(1);
    if (existingNormalized) {
      return Response.json(
        { error: "An account already exists for that email address." },
        { status: 409 }
      );
    }
    if (username) {
      const [existingUsername] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
      if (existingUsername) {
        return Response.json({ error: "That username is already taken." }, { status: 409 });
      }
    }

    const { hash, salt } = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const [user] = await db
      .insert(users)
      .values({
        email,
        emailNormalized,
        username: username || null,
        displayName: displayName || null,
        passwordHash: hash,
        passwordSalt: salt,
        verificationToken,
        verificationTokenExpiresAt: newVerificationExpiry(),
      })
      .returning({ id: users.id, email: users.email, username: users.username, displayName: users.displayName });

    const token = generateSessionToken();
    await db.insert(sessions).values({ token, userId: user.id, expiresAt: newSessionExpiry() });

    const verifyUrl = `${new URL(request.url).origin}/api/auth/verify?token=${verificationToken}`;
    const emailResult = await sendVerificationEmail(email, verifyUrl);

    return Response.json(
      {
        user,
        verification: emailResult.sent
          ? { sent: true }
          : // No email provider configured yet — surface the real link
            // instead of a silent no-op, so the flow stays honestly testable.
            { sent: false, devVerifyUrl: emailResult.verifyUrl },
      },
      { status: 201, headers: { "Set-Cookie": setSessionCookieHeader(token) } }
    );
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
