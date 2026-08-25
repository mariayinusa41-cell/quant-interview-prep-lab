"use client";

import { useState } from "react";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* The endpoint reports the same thing either way, so a network
         failure is shown as success too rather than hinting at state. */
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="pixel-stage" style={{ maxWidth: 420 }}>
        <p className="quiz-panel-title" style={{ marginBottom: 8 }}>Check your email</p>
        <p className="mm-step-hint">
          If <strong>{email}</strong> has an account, a reset link is on its way. It expires in an hour and works
          once.
        </p>
        <p className="mm-step-hint" style={{ marginTop: 12 }}>
          Nothing arrived? Check spam, then try again in a couple of minutes.
        </p>
        <a href="/login" className="chip-btn" style={{ marginTop: 16, display: "inline-block" }}>
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="pixel-stage" style={{ maxWidth: 420 }}>
      <p className="mm-step-hint" style={{ marginBottom: 16 }}>
        Enter the email on your account and we&rsquo;ll send a link to choose a new password.
      </p>
      <form onSubmit={submit}>
        <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
          EMAIL
        </label>
        <div className="quiz-q-input-row" style={{ marginBottom: 14 }}>
          <input
            type="email"
            className="quiz-q-input"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="continue-btn" disabled={submitting || !email}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="mm-step-hint" style={{ marginTop: 14 }}>
        <a href="/login">Back to sign in</a>
      </p>
    </div>
  );
}
