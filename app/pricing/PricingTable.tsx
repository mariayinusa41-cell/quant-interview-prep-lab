"use client";

import { useEffect, useState } from "react";

// Paid tiers call app/api/billing/checkout/route.ts, which creates a real
// Stripe Checkout Session (lib/stripe.ts) and returns its URL — the button
// redirects the browser there. If STRIPE_SECRET_KEY isn't configured, that
// route returns an honest error instead of a fake success, and this page
// surfaces the real message rather than pretending the purchase went through.

type Plan = {
  id: "guest" | "free-account" | "two_week" | "monthly";
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  bullets: string[];
  cta: string;
  href?: string; // real, working link — used for the two free tiers
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "guest",
    name: "Guest",
    price: "$0",
    cadence: "no account",
    blurb: "Browse without signing up.",
    bullets: ["Always-free games playable immediately", "No tickets, accuracy tracking, or daily challenge", "~20% of the full catalog"],
    cta: "Browse free",
    href: "/",
  },
  {
    id: "free-account",
    name: "Free account",
    price: "$0",
    cadence: "per month",
    blurb: "Sign up, keep your progress, unlock more with tokens.",
    bullets: ["Everything in Guest, plus real progress tracking", "100 starting tokens for token-gated games", "~30% of the full catalog unlocked outright"],
    cta: "Create free account",
    href: "/login",
  },
  {
    id: "two_week",
    name: "2-Week Pass",
    price: "$19.99",
    cadence: "one-time, 2 weeks",
    blurb: "Cramming for a specific interview? Full access for the stretch you actually need it.",
    bullets: ["Every game and assessment unlocked", "No token gate, no recurring charge", "Built for a single interview cycle"],
    cta: "Get 2-week access",
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$29.99",
    cadence: "per month",
    blurb: "Ongoing prep across a full recruiting season.",
    bullets: ["Everything in the 2-Week Pass", "Cancel anytime", "Best for a multi-week or multi-month search"],
    cta: "Subscribe monthly",
    highlighted: true,
  },
];

export default function PricingTable() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifyBanner, setVerifyBanner] = useState<string | null>(null);

  // No public webhook endpoint exists in this dev environment, so payment
  // confirmation happens here instead: on return from Stripe with
  // ?session_id=..., ask the server to re-fetch that session from Stripe
  // directly (app/api/billing/verify) and mark the account paid if it's
  // real. This never trusts the redirect URL by itself.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const checkout = params.get("checkout");
    if (checkout !== "success" || !sessionId) return;

    fetch("/api/billing/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => res.json())
      .then((data: { passHolder?: boolean; error?: string }) => {
        setVerifyBanner(
          data.passHolder
            ? "Payment confirmed — your name will show gold on the leaderboard."
            : data.error ?? "Couldn't confirm payment yet — if you were charged, refresh this page."
        );
      })
      .catch(() => setVerifyBanner("Network error confirming payment — refresh this page to retry."));

    window.history.replaceState({}, "", "/pricing");
  }, []);

  const startCheckout = async (planId: Plan["id"]) => {
    setPendingId(planId);
    setErrorId(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErrorId(planId);
        setErrorMsg(data.error ?? "Something went wrong starting checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setErrorId(planId);
      setErrorMsg("Network error — the request never reached the server.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">Pricing</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 24, maxWidth: 640 }}>
        Free to try, full access when you need it. The paid tiers match how interview prep actually works — a short,
        intense stretch before one interview, or an ongoing search across a season.
      </p>

      {verifyBanner && (
        <p
          className={verifyBanner.startsWith("Payment confirmed") ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}
          style={{ marginBottom: 20, maxWidth: 640 }}
        >
          {verifyBanner}
        </p>
      )}

      <div className="pricing-grid">
        {PLANS.map((plan) => (
          <div className={plan.highlighted ? "pricing-card is-highlighted" : "pricing-card"} key={plan.id}>
            {plan.highlighted && <span className="pricing-badge">Most popular</span>}
            <h2 className="pricing-plan-name">{plan.name}</h2>
            <p className="pricing-plan-price">
              {plan.price}
              <span className="pricing-plan-cadence"> / {plan.cadence}</span>
            </p>
            <p className="pricing-plan-blurb">{plan.blurb}</p>
            <ul className="pricing-bullets">
              {plan.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>

            {plan.href ? (
              <a href={plan.href} className="continue-btn pricing-cta">
                {plan.cta}
              </a>
            ) : (
              <button
                type="button"
                className="continue-btn pricing-cta"
                disabled={pendingId === plan.id}
                onClick={() => startCheckout(plan.id)}
              >
                {pendingId === plan.id ? "Redirecting..." : plan.cta}
              </button>
            )}

            {errorId === plan.id && <p className="pricing-not-connected">{errorMsg}</p>}
          </div>
        ))}
      </div>

      <p className="assess-footnote" style={{ marginTop: 24 }}>
        Guest and Free-account access percentages are an approximate split of the current game catalog, not a hard
        technical count — they&rsquo;ll drift slightly as new games ship.
      </p>

      {/* Billing terms stated at the point of purchase, not only buried in
          the Terms page. The 2-Week Pass is a one-time charge and Monthly
          auto-renews; several jurisdictions require that distinction to be
          conspicuous before payment, and Stripe checks for these links
          during business verification. */}
      <p className="pricing-legal">
        The 2-Week Pass is a <strong>one-time charge</strong> and does not renew. Monthly is a{" "}
        <strong>recurring subscription</strong> that renews until you cancel. Full refund within 7 days, no
        questions asked. See our <a href="/legal/terms">Terms</a>,{" "}
        <a href="/legal/privacy">Privacy Policy</a> and <a href="/legal/refunds">Refund Policy</a>.
      </p>
    </div>
  );
}
