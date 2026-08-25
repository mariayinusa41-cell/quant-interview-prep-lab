// Real email delivery via Resend's HTTP API (a fetch call — no SMTP, so it
// runs fine on the Workers runtime).
//
// Two things have to be true for a real user to receive anything:
//
//   1. RESEND_API_KEY is set (an API key from resend.com; the free tier is
//      plenty for this volume).
//   2. EMAIL_FROM is a sender on a domain you have verified with Resend.
//      The default below is Resend's shared sandbox sender, which ONLY ever
//      delivers to the address that owns the Resend account — with it, a key
//      that looks correctly configured still sends nothing to real signups.
//
// When the key is missing, sendVerificationEmail does not pretend to have
// sent anything: it reports `sent: false` with a reason, and logs loudly, so
// the failure is visible in the Worker logs rather than silently stranding
// every new account on the unverified side of the welcome gift.

import { env } from "cloudflare:workers";

type SendResult = { sent: boolean; reason?: string };

// `env`'s typing doesn't declare arbitrary secrets, so these are read via an
// index cast rather than as typed bindings like `env.DB`. An empty string
// counts as unset — that's how the variable actually appears in .dev.vars
// before anyone fills it in.
function envVar(name: string): string | undefined {
  const raw = (env as unknown as Record<string, string | undefined>)[name];
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

const SANDBOX_FROM = "Outcry <onboarding@resend.dev>";

/**
 * Whether it's safe to hand the verification link back in the HTTP response.
 *
 * Only ever true on localhost. On a real deployment this must stay false:
 * returning the link would mean anyone could sign up with someone else's
 * address, read the link out of their own response, verify it without ever
 * touching that inbox, and claim the welcome tokens — as many times as they
 * have addresses to burn. That would make email verification prove nothing.
 */
export function isLocalRequest(request: Request): boolean {
  const host = new URL(request.url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
}

/** Shared Resend call. Both account emails go through here. */
async function send(
  toEmail: string,
  subject: string,
  text: string,
  html: string,
  purpose: string,
): Promise<SendResult> {
  const apiKey = envVar("RESEND_API_KEY");
  if (!apiKey) {
    console.error(`[email] RESEND_API_KEY is not set - no ${purpose} email was sent.`);
    return { sent: false, reason: "not-configured" };
  }

  const from = envVar("EMAIL_FROM") ?? SANDBOX_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [toEmail], subject, text, html }),
    });

    if (!res.ok) {
      // Resend puts the actual cause in the body — wrong key, unverified
      // sending domain, rate limit. Throwing that away left a bare
      // `sent: false` with nothing to debug from.
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend rejected the ${purpose} send (HTTP ${res.status}): ${detail}`);
      return { sent: false, reason: `resend-${res.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error(`[email] Resend ${purpose} request failed:`, error);
    return { sent: false, reason: "network" };
  }
}

export async function sendVerificationEmail(toEmail: string, verifyUrl: string): Promise<SendResult> {
  return send(
    toEmail,
    "Verify your email",
    // A text part alongside the HTML: some clients prefer it, and it keeps
    // the message from looking like a bare link to spam filters.
    `Confirm your Outcry account by opening this link:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    `<p>Confirm your Outcry account:</p>` +
      `<p><a href="${verifyUrl}">${verifyUrl}</a></p>` +
      `<p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>`,
    "verification",
  );
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<SendResult> {
  return send(
    toEmail,
    "Reset your Outcry password",
    `Someone asked to reset the password for this Outcry account.\n\n` +
      `Open this link to choose a new one:\n\n${resetUrl}\n\n` +
      `This link expires in 1 hour and can only be used once.\n\n` +
      `If this wasn't you, ignore this email - your password has not changed.`,
    `<p>Someone asked to reset the password for this Outcry account.</p>` +
      `<p><a href="${resetUrl}">Choose a new password</a></p>` +
      `<p style="word-break:break-all;font-size:12px;color:#666">${resetUrl}</p>` +
      `<p>This link expires in <strong>1 hour</strong> and can only be used once.</p>` +
      `<p>If this wasn't you, you can ignore this email - your password has not changed.</p>`,
    "password reset",
  );
}
