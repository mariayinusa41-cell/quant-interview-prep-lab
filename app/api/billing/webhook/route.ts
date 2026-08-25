import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
import { passExpiryFor, type PlanId } from "../../../../lib/stripe";

// Stripe webhook.
//
// The site previously relied only on "verify on return": the pricing page
// calls /api/billing/verify when Stripe redirects back. That covers the
// happy path and nothing else. If the customer closes the tab, loses
// signal, or the redirect fails, they have paid and never receive the pass
// — and there was no second path that could grant it.
//
// It also had no way to take access away. isPassHolder was set to 1 and
// never set back, so a cancelled subscription or a failed renewal kept
// working indefinitely.
//
// Both directions are handled here, off events Stripe sends server-to-server
// and will retry if we fail.

const asEnv = () => env as unknown as Record<string, string | undefined>;

/**
 * Verifies Stripe's signature header.
 *
 * Without this the endpoint is an open "make me a pass holder" API — anyone
 * who knows the URL could POST a fake checkout.session.completed. Stripe
 * signs every delivery with a shared secret; this recomputes the same HMAC
 * and compares in constant time.
 */
async function verifySignature(payload: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as { t?: string; v1?: string };
  if (!parts.t || !parts.v1) return false;

  // Reject deliveries older than five minutes so a captured request cannot
  // be replayed later.
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${payload}`));
  const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");

  if (expected.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}

type StripeEvent = {
  type: string;
  data: { object: Record<string, unknown> };
};

export async function POST(request: Request) {
  const secret = asEnv().STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: an unverifiable webhook must not be allowed to grant
    // anything, so a missing secret disables the endpoint rather than
    // trusting whatever arrives.
    return Response.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const ok = await verifySignature(payload, request.headers.get("stripe-signature"), secret);
  if (!ok) return Response.json({ error: "Bad signature." }, { status: 400 });

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return Response.json({ error: "Malformed payload." }, { status: 400 });
  }

  try {
    const db = getDb();
    const obj = event.data.object;

    switch (event.type) {
      // The customer paid. This is the same grant the return-verify does,
      // and it is safe for both to run: setting the same expiry twice is
      // idempotent.
      case "checkout.session.completed": {
        const userId = Number(obj.client_reference_id ?? (obj.metadata as Record<string, string>)?.user_id);
        if (!Number.isFinite(userId)) break;

        const rawPlan = (obj.metadata as Record<string, string> | undefined)?.plan;
        const plan: PlanId = rawPlan === "monthly" ? "monthly" : "two_week";

        await db
          .update(users)
          .set({
            isPassHolder: 1,
            passExpiresAt: passExpiryFor(plan, null),
            stripeCustomerId: typeof obj.customer === "string" ? obj.customer : null,
            stripeSubscriptionId: typeof obj.subscription === "string" ? obj.subscription : null,
          })
          .where(eq(users.id, userId));
        break;
      }

      // A renewal succeeded — push the expiry out to the new period end so
      // a paying subscriber never lapses.
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const customerId = typeof obj.customer === "string" ? obj.customer : null;
        if (!customerId) break;
        const periodEnd = Number(
          (obj.lines as { data?: { period?: { end?: number } }[] } | undefined)?.data?.[0]?.period?.end,
        );
        await db
          .update(users)
          .set({
            isPassHolder: 1,
            passExpiresAt: passExpiryFor("monthly", Number.isFinite(periodEnd) ? periodEnd : null),
          })
          .where(eq(users.stripeCustomerId, customerId));
        break;
      }

      // Cancelled, or the card finally failed. Access ends now rather than
      // continuing forever, which is what used to happen.
      case "customer.subscription.deleted":
      case "invoice.payment_failed": {
        const customerId = typeof obj.customer === "string" ? obj.customer : null;
        if (!customerId) break;
        await db
          .update(users)
          .set({ isPassHolder: 0, passExpiresAt: null, stripeSubscriptionId: null })
          .where(eq(users.stripeCustomerId, customerId));
        break;
      }

      default:
        // Unhandled types are acknowledged, not errored — returning non-2xx
        // would make Stripe retry an event we simply do not care about.
        break;
    }

    return Response.json({ received: true });
  } catch {
    // A 500 tells Stripe to retry, which is what we want if the database
    // was briefly unavailable.
    return Response.json({ error: "Handler failed." }, { status: 500 });
  }
}
