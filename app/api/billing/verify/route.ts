import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { getCurrentUser } from "../../../../lib/auth";
import { passExpiryFor, retrieveCheckoutSession } from "../../../../lib/stripe";

// Called by the pricing page the moment it loads with ?session_id=... —
// see lib/stripe.ts's retrieveCheckoutSession for why this exists instead
// of a webhook. Requires the CALLER to also be signed in as the same
// account the session was created for, so pasting someone else's success
// URL doesn't grant you their pass.
export async function POST(request: Request) {
  const me = await getCurrentUser(request);
  if (!me) return Response.json({ error: "Not signed in." }, { status: 401 });

  try {
    const payload = (await request.json()) as { sessionId?: string };
    const sessionId = payload.sessionId;
    if (!sessionId) return Response.json({ error: "Missing session id." }, { status: 400 });

    const result = await retrieveCheckoutSession(sessionId);
    if ("error" in result) return Response.json({ error: result.error }, { status: 503 });

    if (!result.paid) return Response.json({ passHolder: false, reason: "Payment not completed." });
    if (result.userId !== me.id) {
      return Response.json({ error: "This checkout session belongs to a different account." }, { status: 403 });
    }

    // Grant until a DATE, not forever. Setting isPassHolder alone made a
    // 2-week pass permanent and let a cancelled subscription keep working.
    const plan = result.plan ?? "two_week";
    const expiresAt = passExpiryFor(plan, result.periodEnd);

    const db = getDb();
    await db
      .update(users)
      .set({
        isPassHolder: 1,
        passExpiresAt: expiresAt,
        stripeCustomerId: result.customerId,
        stripeSubscriptionId: result.subscriptionId,
      })
      .where(eq(users.id, me.id));

    return Response.json({ passHolder: true, expiresAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
