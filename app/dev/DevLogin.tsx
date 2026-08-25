"use client";

import { useEffect, useState } from "react";

export default function DevLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"checking" | "in" | "out" | "unconfigured">("checking");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch("/api/dev/session", { credentials: "same-origin" });
      const data = (await res.json()) as { isDeveloper: boolean; configured: boolean };
      setStatus(data.isDeveloper ? "in" : data.configured ? "out" : "unconfigured");
    } catch {
      setStatus("out");
    }
  };

  useEffect(() => { void refresh(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/dev/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Those credentials were not accepted.");
        return;
      }
      // Full reload so AccessContext re-reads developer status from the
      // server rather than being told about it by this component.
      window.location.href = "/";
    } catch {
      setError("Network error — that never reached the server.");
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    await fetch("/api/dev/session", { method: "DELETE", credentials: "same-origin" });
    window.location.href = "/";
  };

  if (status === "checking") {
    return <p className="mm-step-hint">Checking...</p>;
  }

  if (status === "unconfigured") {
    return (
      <div className="pixel-stage" style={{ maxWidth: 420 }}>
        <p className="quiz-q-explain is-wrong">
          No developer credentials are set on this deployment. Set the <code>DEV_USERNAME</code> and{" "}
          <code>DEV_PASSWORD</code> secrets to enable developer mode.
        </p>
      </div>
    );
  }

  if (status === "in") {
    return (
      <div className="pixel-stage" style={{ maxWidth: 420 }}>
        <p className="quiz-panel-title" style={{ marginBottom: 8 }}>Developer mode active</p>
        <p className="mm-step-hint" style={{ marginBottom: 16 }}>
          The access-mode picker is visible on the hub, and every game is unlocked. This lasts 12 hours.
        </p>
        <button type="button" className="chip-btn" onClick={signOut}>
          Sign out of developer mode
        </button>
      </div>
    );
  }

  return (
    <div className="pixel-stage" style={{ maxWidth: 420 }}>
      <p className="mm-step-hint" style={{ marginBottom: 16 }}>
        Developer access unlocks every game and shows the access-mode picker. It is not a player account.
      </p>
      <form onSubmit={submit}>
        <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
          DEVELOPER USERNAME
        </label>
        <div className="quiz-q-input-row" style={{ marginBottom: 14 }}>
          <input
            type="text"
            className="quiz-q-input"
            autoComplete="off"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
          DEVELOPER PASSWORD
        </label>
        <div className="quiz-q-input-row" style={{ marginBottom: 14 }}>
          <input
            type="password"
            className="quiz-q-input"
            autoComplete="off"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="quiz-q-explain is-wrong" style={{ marginBottom: 10 }}>{error}</p>}

        <button type="submit" className="continue-btn" disabled={submitting}>
          {submitting ? "Checking..." : "Enter developer mode"}
        </button>
      </form>
    </div>
  );
}
