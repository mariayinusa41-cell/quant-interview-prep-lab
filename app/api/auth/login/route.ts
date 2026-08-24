import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions, users } from "../../../../db/schema";
import {
  generateSessionToken,
  newSessionExpiry,
  normalizeEmail,
  setSessionCookieHeader,
  verifyPassword,
} from "../../../../lib/auth";

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
    const payload = (await request.json()) as { email?: string; password?: string };
    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Same message either way — confirming "that email isn't registered"
    // vs. "wrong password" is a free account-enumeration oracle.
    const invalid = () => Response.json({ error: "Incorrect email or password." }, { status: 401 });

    if (!user) return invalid();
    const ok = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!ok) return invalid();

    const token = generateSessionToken();
    await db.insert(sessions).values({ token, userId: user.id, expiresAt: newSessionExpiry() });

    return Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          emailVerified: user.emailVerifiedAt !== null,
        },
      },
      { status: 200, headers: { "Set-Cookie": setSessionCookieHeader(token) } }
    );
  } catch (error) {
    return Response.json({ error: toRouteErrorMessage(error) }, { status: 500 });
  }
}
