// Stripe Checkout via a raw fetch call to their REST API — same approach as
// lib/email.ts's Resend integration, and for the same reason: no Node-only
// SDK dependency, just an HTTP call, which is what actually runs cleanly on
// the Workers runtime. Stripe's API takes HTTP Basic Auth with the secret
// key as the username and no password, and a form-urlencoded body.

import { env } from "cloudflare:workers";

export type PlanId = "two_week" | "monthly";

const PLAN_CONFIG: Record<PlanId, { name: string; amountCents: number; mode: "payment" | "subscription" }> = {
  two_week: { name: "2-Week Pass", amountCents: 1999, mode: "payment" },
  monthly: { name: "Monthly", amountCents: 2999, mode: "subscription" },
};

function getStripeSecretKey(): string | undefined {
  return (env as unknown as Record<string, string | undefined>).STRIPE_SECRET_KEY;
}

function encodeForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

export type CheckoutResult = { url: string } | { error: string };

// `userId` becomes the session's client_reference_id — the thread that lets
// app/api/billing/verify/route.ts attribute a completed payment back to a
// specific account. Without it, "who paid" would be un-answerable and the
// leaderboard's gold-name treatment would have nothing real to check.
export async function createCheckoutSession(plan: PlanId, origin: string, userId: number): Promise<CheckoutResult> {
  const apiKey = getStripeSecretKey();
  if (!apiKey) return { error: "Stripe isn't connected yet — no STRIPE_SECRET_KEY configured." };

  const config = PLAN_CONFIG[plan];
  if (!config) return { error: "Unknown plan." };

  const body: Record<string, string> = {
    mode: config.mode,
    client_reference_id: String(userId),
    success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": config.name,
    "line_items[0][price_data][unit_amount]": String(config.amountCents),
    // This Stripe account has Managed Payments on by default, which refuses
    // a session unless every line item's product has a tax code assigned.
    // Disabling it per-session is the documented escape hatch for exactly
    // this case (docs.stripe.com/payments/managed-payments/eligibility) —
    // real tax-code categorization is a separate, later task, not something
    // to fake here.
    "managed_payments[enabled]": "false",
  };
  if (config.mode === "subscription") {
    body["line_items[0][price_data][recurring][interval]"] = "month";
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeForm(body),
  });

  const data = (await res.json()) as { url?: string; error?: { message?: string } };
  if (!res.ok || !data.url) {
    return { error: data.error?.message ?? "Stripe rejected the checkout session." };
  }
  return { url: data.url };
}

export type VerifyResult = { paid: boolean; userId: number | null } | { error: string };

// Re-fetches the session from Stripe rather than trusting the success-page
// redirect itself (a redirect is just a URL the browser was told to visit —
// anyone could type it). This is the "verify on return" pattern: no public
// webhook endpoint exists in this dev environment to receive
// checkout.session.completed, so the pricing page calls this the moment it
// loads with ?session_id=..., and this function is the part that actually
// asks Stripe "was this really paid," not the client.
export async function retrieveCheckoutSession(sessionId: string): Promise<VerifyResult> {
  const apiKey = getStripeSecretKey();
  if (!apiKey) return { error: "Stripe isn't connected yet — no STRIPE_SECRET_KEY configured." };

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Basic ${btoa(`${apiKey}:`)}` },
  });
  const data = (await res.json()) as {
    payment_status?: string;
    status?: string;
    client_reference_id?: string | null;
    error?: { message?: string };
  };
  if (!res.ok) return { error: data.error?.message ?? "Stripe rejected the session lookup." };

  // Subscriptions and one-time payments report success differently:
  // one-time is payment_status "paid"; subscriptions go through Checkout in
  // "subscription" mode where session status "complete" is the signal
  // (payment_status can read "no_payment_required" there in test mode).
  const paid = data.payment_status === "paid" || data.status === "complete";
  const userId = data.client_reference_id ? Number(data.client_reference_id) : null;
  return { paid, userId: Number.isFinite(userId) ? userId : null };
}
