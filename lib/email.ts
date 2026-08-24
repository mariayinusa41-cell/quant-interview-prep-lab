// Real email delivery via Resend's HTTP API (a fetch call — no SMTP, so it
// runs fine on the Workers runtime). Gated on a RESEND_API_KEY binding that
// isn't configured yet: when it's missing, sendVerificationEmail does NOT
// pretend to have sent anything — it returns `sent: false` plus the actual
// verification link, so the caller can surface that honestly (dev-mode
// banner with the real link) instead of showing a fake "check your email."
//
// To make this live: add a RESEND_API_KEY to the project's env/secrets
// (an API key from resend.com, free tier is plenty for this volume) and
// sending switches on with no code change.

import { env } from "cloudflare:workers";

type SendResult = { sent: boolean; verifyUrl: string };

function getResendKey(): string | undefined {
  // `env`'s typing doesn't declare arbitrary secrets, so this is read via
  // an index cast rather than as a typed binding like `env.DB`.
  return (env as unknown as Record<string, string | undefined>).RESEND_API_KEY;
}

export async function sendVerificationEmail(toEmail: string, verifyUrl: string): Promise<SendResult> {
  const apiKey = getResendKey();
  if (!apiKey) {
    return { sent: false, verifyUrl };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Outcry <onboarding@resend.dev>",
      to: [toEmail],
      subject: "Verify your email",
      html: `<p>Confirm your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    }),
  });

  return { sent: res.ok, verifyUrl };
}
