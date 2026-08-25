"use client";

import { useEffect, useState } from "react";

// The verification flow had no UI at all: signing up said nothing about
// needing to verify, there was no way to ask for another email, and the
// ?verify= flag that app/api/auth/verify/route.ts redirects back with was
// read by nobody. So even with sending correctly configured, a new player
// had no reason to know the welcome gift was waiting behind a click in
// their inbox.
//
// This sits next to GiftBox and covers the unverified state: who we're
// waiting on, and a way to send another email.

type Me = { email: string; emailVerified: boolean } | null;

type ResendState = "idle" | "sending" | "sent" | "failed";

export default function VerifyEmailNotice() {
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const [resend, setResend] = useState<ResendState>("idle");
  const [detail, setDetail] = useState<string | null>(null);
  // Only ever populated on localhost — the API refuses to return the link
  // from a real host. See lib/email.ts isLocalRequest.
  const [devUrl, setDevUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: { user: Me }) => setMe(data.user))
      .catch(() => setMe(null))
      .finally(() => setLoaded(true));
  }, []);

  const requestResend = async () => {
    setResend("sending");
    setDetail(null);
    setDevUrl(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        sent?: boolean;
        reason?: string;
        devVerifyUrl?: string;
        error?: string;
      };
      if (data.sent) {
        setResend("sent");
        return;
      }
      setResend("failed");
      setDevUrl(data.devVerifyUrl ?? null);
      setDetail(
        data.error ??
          (data.reason === "not-configured"
            ? "Email sending isn't configured on the server yet."
            : "The email provider rejected the send."),
      );
    } catch {
      setResend("failed");
      setDetail("Network error - the request never reached the server.");
    }
  };

  // The post-click confirmation is handled by VerifyResultBanner at the top
  // level, since that's where the email link actually lands. This only nags.
  if (!loaded || !me || me.emailVerified) return null;

  return (
    <div className="verify-note is-pending" role="status">
      <p>
        Verify <strong>{me.email}</strong> to unlock your welcome gift.
      </p>
      {resend === "sent" ? (
        <p className="verify-note-sub">Sent - check your inbox (and spam).</p>
      ) : (
        <button type="button" className="verify-note-btn" onClick={requestResend} disabled={resend === "sending"}>
          {resend === "sending" ? "Sending..." : "Resend email"}
        </button>
      )}
      {resend === "failed" && detail && <p className="verify-note-sub is-bad">{detail}</p>}
      {devUrl && (
        <p className="verify-note-sub">
          Local dev only -{" "}
          <a href={devUrl} className="verify-note-link">
            open the verification link
          </a>
        </p>
      )}
    </div>
  );
}
