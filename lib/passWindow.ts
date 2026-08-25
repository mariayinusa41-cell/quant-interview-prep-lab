// When a paid pass starts and stops being valid.
//
// Pure functions with no bindings, deliberately kept out of lib/stripe.ts
// and lib/auth.ts: both of those import "cloudflare:workers", which makes
// them unimportable outside the Workers runtime and therefore untestable.
// Money rules are exactly the code that should be testable.

export type PlanId = "two_week" | "monthly";

/** How long a one-off pass lasts. The 2-week pass is exactly that. */
export const TWO_WEEK_MS = 14 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * When a plan's access should expire, given the moment it was bought.
 *
 * isPassHolder used to be a one-way switch — set on payment, never unset —
 * so a "2-Week Pass" bought permanent access and a cancelled subscription
 * kept working. Every grant now carries a date.
 */
export function passExpiryFor(plan: PlanId, periodEnd: number | null, now = Date.now()): string {
  if (plan === "monthly" && periodEnd) {
    // Trust Stripe's period end for subscriptions: it already accounts for
    // proration, trials and billing-cycle anchors.
    return new Date(periodEnd * 1000).toISOString();
  }
  if (plan === "monthly") {
    // No period end in the payload — fall back to a month rather than
    // locking out someone who has genuinely paid.
    return new Date(now + MONTH_MS).toISOString();
  }
  return new Date(now + TWO_WEEK_MS).toISOString();
}

/**
 * Whether a stored pass is still valid right now.
 *
 * Checked against the date, not just the flag: the webhook may not have
 * fired yet or may have failed, and access should end on time regardless of
 * whether Stripe reached us.
 */
export function isPassActive(flag: number, expiresAt: string | null): boolean {
  if (flag !== 1) return false;
  // No date means an unbounded grant, which only happens if set by hand.
  if (!expiresAt) return true;
  const end = Date.parse(expiresAt);
  return Number.isFinite(end) ? end > Date.now() : false;
}
