"use client";

import { useEffect, useState } from "react";

// A real account form — POSTs to app/api/auth/{signup,login}/route.ts,
// which hash/verify against the D1 `users` table and set a real httpOnly
// session cookie (see lib/auth.ts). No local-storage stand-in here; if the
// request fails, the UI shows the actual server error, not a fake success.
//
// Fields match app/profile/Onboarding.tsx's auth step exactly (display
// name, username, email, password) — this page is the second, direct-URL
// entry point to the same real signup/login, not a separate simplified one.

type Mode = "login" | "signup";
type Me = { id: number; email: string } | null;

async function fetchMe(): Promise<Me> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: Me };
  return data.user ?? null;
}

export default function LoginForm() {
  const [me, setMe] = useState<Me>(null);
  const [checkedMe, setCheckedMe] = useState(false);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then(setMe)
      .finally(() => setCheckedMe(true));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = mode === "signup" ? { email, password, username, displayName } : { email, password };
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { user?: { id: number; email: string }; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // Signing in from this page should land you in the same
      // character/track onboarding as signing up from the attract screen —
      // Onboarding.tsx checks for a live session and skips straight to the
      // avatar step when it finds one, so this isn't a dead end.
      window.location.href = "/";
    } catch {
      setError("Network error — the request never reached the server.");
    } finally {
      setSubmitting(false);
    }
  };

  const logOut = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      setMe(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkedMe && me) {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Outcry</p>
        <h1 className="pirate-story-line answer-title">You&rsquo;re signed in</h1>
        <div className="pixel-stage" style={{ maxWidth: 420 }}>
          <p className="quiz-panel-title" style={{ marginBottom: 4 }}>
            {me.email}
          </p>
          <p className="mm-step-hint" style={{ marginBottom: 16 }}>
            This is a real account backed by the database — the session persists across visits until you log out.
          </p>
          <button type="button" className="chip-btn" disabled={submitting} onClick={logOut}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">{mode === "login" ? "Log in" : "Sign up"}</h1>

      <div className="pixel-stage" style={{ maxWidth: 420 }}>
        <div className="answer-crew-picker" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={mode === "login" ? "chip-btn active" : "chip-btn"}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === "signup" ? "chip-btn active" : "chip-btn"}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "signup" && (
            <>
              <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
                DISPLAY NAME (optional)
              </label>
              <div className="quiz-q-input-row" style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  className="quiz-q-input"
                  placeholder="How you appear on the leaderboard"
                  autoComplete="off"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
                USERNAME (optional)
              </label>
              <div className="quiz-q-input-row" style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  className="quiz-q-input"
                  placeholder="Unique handle, no spaces"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </>
          )}

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

          <label className="pick-ticket-col-label" style={{ display: "block", marginBottom: 6 }}>
            PASSWORD
          </label>
          <div className="quiz-q-input-row" style={{ marginBottom: 6 }}>
            <input
              type="password"
              className="quiz-q-input"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {mode === "signup" && (
            <p className="mm-step-hint" style={{ marginBottom: 14 }}>
              At least 8 characters.
            </p>
          )}

          {error && (
            <p className="quiz-q-explain is-wrong" style={{ marginTop: 4, marginBottom: 10 }}>
              {error}
            </p>
          )}

          <button type="submit" className="continue-btn" disabled={submitting} style={{ marginTop: 10 }}>
            {submitting ? "Working..." : mode === "login" ? "Log in" : "Create account"}
          </button>

          {/* Only on the login tab: offering a password reset to someone
              part-way through creating an account is confusing. */}
          {mode === "login" && (
            <p className="mm-step-hint" style={{ marginTop: 14, textAlign: "center" }}>
              <a href="/forgot-password">Forgot your password?</a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
