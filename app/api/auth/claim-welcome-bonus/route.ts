import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { getCurrentUser } from "../../../../lib/auth";

export const WELCOME_BONUS_TOKENS = 100;

// One-time claim, guarded server-side by `welcomeBonusClaimedAt` — the
// actual tokens still get credited client-side (AccessContext.grantTokens),
// since tokens aren't DB-backed anywhere else on the site. This route's job
// is just the part a client can't be trusted to do honestly: prove the
// account is real, verified, and hasn't claimed this before.
export async function POST(request: Request) {
  const me = await getCurrentUser(request);
  if (!me) return Response.json({ error: "Not signed in." }, { status: 401 });
  if (!me.emailVerified) return Response.json({ error: "Verify your email first." }, { status: 403 });
  if (me.welcomeBonusClaimed) return Response.json({ error: "Already claimed." }, { status: 409 });

  const db = getDb();
  const now = new Date().toISOString();
  await db.update(users).set({ welcomeBonusClaimedAt: now }).where(eq(users.id, me.id));

  return Response.json({ claimed: true, tokens: WELCOME_BONUS_TOKENS });
}
