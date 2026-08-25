"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const MIN_PASSWORD = 8;

export default function ResetForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setToken(searchParams.get("token") ?? "");
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Checked here as well as server-side so a mistyped confirmation is
    // caught before the single-use token is spent on a failed attempt.
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Choose a password of at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not reset that password.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — that never reached the server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="pixel-stage" style={{ maxWidth: 420 }}>
        <p className="quiz-q-explain is-wrong">
          This page needs a reset link. Open the link from your email, or request a new one.
        </p>
        <a href="/forgot-password" className="chip-btn" style={{ marginTop: 14, display: "inline-block" }}>
          Request a reset link
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="pixel-stage" style={{ maxWidth: 420 }}>
        <p className="quiz-panel-title" style={{ marginBottom: 8 }}>Password changed</p>
        <p className="mm-step-hint">
          You&rsquo;ve been signed out everywhere else as a precaution. Sign in with your new password.
        </p>
        <a href="/login" className="continue-btn" style={{ marginTop: 16, display: "inline-block" }}>
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="pixel-stage" style={{ maxWidth: 420 }}>
      <form onSubmit={submit}>
        <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
          NEW PASSWORD
        </label>
        <div className="quiz-q-input-row" style={{ marginBottom: 14 }}>
          <input
            type="password"
            className="quiz-q-input"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
          CONFIRM NEW PASSWORD
        </label>
        <div className="quiz-q-input-row" style={{ marginBottom: 6 }}>
          <input
            type="password"
            className="quiz-q-input"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <p className="mm-step-hint" style={{ marginBottom: 14 }}>At least {MIN_PASSWORD} characters.</p>

        {error && (
          <p className="quiz-q-explain is-wrong" style={{ marginBottom: 10 }}>
            {error}
          </p>
        )}

        <button type="submit" className="continue-btn" disabled={submitting}>
          {submitting ? "Saving..." : "Set new password"}
        </button>
      </form>
    </div>
  );
}
