import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { generateVerificationToken, getCurrentUser, newVerificationExpiry } from "../../../../lib/auth";
import { sendVerificationEmail } from "../../../../lib/email";

export async function POST(request: Request) {
  const me = await getCurrentUser(request);
  if (!me) return Response.json({ error: "Not signed in." }, { status: 401 });
  if (me.emailVerified) return Response.json({ error: "Already verified." }, { status: 400 });

  const db = getDb();
  const verificationToken = generateVerificationToken();
  await db
    .update(users)
    .set({ verificationToken, verificationTokenExpiresAt: newVerificationExpiry() })
    .where(eq(users.id, me.id));

  const verifyUrl = `${new URL(request.url).origin}/api/auth/verify?token=${verificationToken}`;
  const result = await sendVerificationEmail(me.email, verifyUrl);

  return Response.json(result.sent ? { sent: true } : { sent: false, devVerifyUrl: result.verifyUrl });
}
