import { createCheckoutSession, type PlanId } from "../../../../lib/stripe";
import { getCurrentUser } from "../../../../lib/auth";

const VALID_PLANS: PlanId[] = ["two_week", "monthly"];

export async function POST(request: Request) {
  try {
    // A purchase has to be attributable to a real account, or there's
    // nothing for the leaderboard's pass-holder check to attach to later —
    // so checkout now requires being signed in, not just having a card.
    const me = await getCurrentUser(request);
    if (!me) {
      return Response.json({ error: "Sign in first, then come back to check out." }, { status: 401 });
    }

    const payload = (await request.json()) as { plan?: string };
    const plan = payload.plan;
    if (!plan || !VALID_PLANS.includes(plan as PlanId)) {
      return Response.json({ error: "Unknown plan." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const result = await createCheckoutSession(plan as PlanId, origin, me.id);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 503 });
    }
    return Response.json({ url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}
