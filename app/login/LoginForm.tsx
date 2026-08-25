"use client";

import { useEffect, useState } from "react";
import { useProfile } from "../profile/ProfileContext";
import { SELECTABLE_AVATARS, AvatarSprite, type AvatarId } from "../profile/avatars";
import { AGE_BANDS, EXPERIENCE_LEVELS, MAJORS, TRACKS, type TrackId } from "../profile/tracks";

// A real account form — POSTs to app/api/auth/{signup,login}/route.ts,
// which hash/verify against the D1 `users` table and set a real httpOnly
// session cookie (see lib/auth.ts). No local-storage stand-in here; if the
// request fails, the UI shows the actual server error, not a fake success.
//
// Fields match app/profile/Onboarding.tsx's auth step exactly (display
// name, username, email, password) — this page is the second, direct-URL
// entry point to the same real signup/login, not a separate simplified one.

type Mode = "login" | "signup";
type Me = {
  id: number;
  email: string;
  displayName: string | null;
  avatar: string | null;
  tracks: string[] | null;
  major: string | null;
  experience: string | null;
  ageBand: string | null;
} | null;

async function fetchMe(): Promise<Me> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: Me };
  return data.user ?? null;
}

export default function LoginForm() {
  const { profile, saveProfile } = useProfile();
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
      const data = (await res.json()) as {
        user?: {
          id: number;
          email: string;
          displayName?: string | null;
          avatar?: string | null;
          tracks?: string[] | null;
          major?: string | null;
          experience?: string | null;
          ageBand?: string | null;
        };
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // Sync the local profile with the session this response just created.
      // Without this, someone who started as a guest kept account:"guest"
      // locally after signing up here — the profile card said "Guest
      // session" and the daily challenge stayed locked, against a real
      // session cookie. This was the flow's worst bug.
      //
      // Written straight to localStorage rather than through saveProfile():
      // the next line is a full page navigation, and React's persist effect
      // is not guaranteed to flush before unload. The destination page
      // re-reads storage on mount, so storage is the only state that counts.
      let personalized = profile.personalized;
      // An account that carries its own personalization hydrates this device
      // outright — no onboarding replay, and the account's choices win over
      // whatever a previous user of this browser left behind.
      const serverPersona =
        mode === "login" && data.user?.avatar && (data.user.tracks?.length ?? 0) > 0
          ? {
              avatar: data.user.avatar,
              tracks: data.user.tracks,
              major: data.user.major ?? "",
              experience: data.user.experience ?? "",
              ageBand: data.user.ageBand ?? "",
              personalized: true,
              onboarded: true,
            }
          : null;
      try {
        // Storage is the authority here, read fresh — React state could
        // still be the pre-restore default if the form was submitted fast.
        const raw = window.localStorage.getItem("quant_profile_v1");
        const stored = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        personalized =
          typeof stored.personalized === "boolean" ? stored.personalized : profile.personalized;
        const localName =
          typeof stored.displayName === "string" && stored.displayName !== "Guest"
            ? stored.displayName
            : "";
        // Signup: this is the same person upgrading, so a name they already
        // chose locally wins. Login: this may be a DIFFERENT person on a
        // shared device, so the account's own server name wins — otherwise
        // account B inherits account A's identity.
        const serverName = data.user?.displayName ?? "";
        const name =
          mode === "signup"
            ? localName || displayName.trim() || serverName
            : serverName || localName;
        if (serverPersona) personalized = true;
        window.localStorage.setItem(
          "quant_profile_v1",
          JSON.stringify({
            ...stored,
            account: "account",
            ...(name ? { displayName: name } : {}),
            ...(serverPersona ?? {}),
            // Never personalized (instant guest, or a fresh device with an
            // account that hasn't finished the flow either): re-open
            // onboarding, which resumes at the avatar step against a live
            // session. Otherwise leave onboarded alone.
            ...(personalized ? {} : { onboarded: false }),
          }),
        );
      } catch {
        /* storage unavailable — the reconciler in ProfileContext catches up */
      }
      // ?login=1 skips the attract screen so the steps show immediately.
      window.location.href = personalized ? "/" : "/?login=1";
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
      // The local profile must not keep claiming "Signed in" after the
      // session it described is gone.
      saveProfile({ account: "guest" });
      setMe(null);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- account manager (signed-in view) ----
  // Server values win where they exist; the local profile fills the gaps for
  // accounts created before personalization was stored server-side.
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState<AvatarId>("duck");
  const [editTracks, setEditTracks] = useState<TrackId[]>([]);
  const [editMajor, setEditMajor] = useState("");
  const [editExperience, setEditExperience] = useState("");
  const [editAgeBand, setEditAgeBand] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editorSeeded, setEditorSeeded] = useState(false);

  useEffect(() => {
    if (!me || editorSeeded) return;
    const isAvatar = (v: string | null): v is AvatarId => SELECTABLE_AVATARS.some((a) => a.id === v);
    const validTracks = (v: string[] | null): TrackId[] =>
      (v ?? []).filter((t): t is TrackId => TRACKS.some((k) => k.id === t));
    setEditName(me.displayName ?? (profile.displayName !== "Guest" ? profile.displayName : ""));
    setEditAvatar(isAvatar(me.avatar) ? me.avatar : profile.avatar);
    setEditTracks(me.tracks?.length ? validTracks(me.tracks) : profile.tracks);
    setEditMajor(me.major ?? profile.major);
    setEditExperience(me.experience ?? profile.experience);
    setEditAgeBand(me.ageBand ?? profile.ageBand);
    setEditorSeeded(true);
  }, [me, editorSeeded, profile]);

  const toggleEditTrack = (id: TrackId) =>
    setEditTracks((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const saveAccountProfile = async () => {
    setSaveState("saving");
    setSaveError(null);
    try {
      const body = {
        displayName: editName,
        avatar: editAvatar,
        tracks: editTracks,
        major: editMajor,
        experience: editExperience,
        ageBand: editAgeBand,
      };
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setSaveState("failed");
        setSaveError(data.error ?? "Could not save.");
        return;
      }
      // Mirror locally so this device agrees with the account immediately.
      saveProfile({
        displayName: editName.trim(),
        avatar: editAvatar,
        tracks: editTracks,
        major: editMajor,
        experience: editExperience,
        ageBand: editAgeBand,
        personalized: true,
      });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("failed");
      setSaveError("Network error — nothing was saved.");
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = (await res.json()) as { deleted?: boolean; error?: string };
      if (!res.ok || !data.deleted) {
        setDeleteError(data.error ?? "Could not delete the account.");
        return;
      }
      // The account is gone: this browser goes back to being a fresh guest.
      // Synchronous write, same reasoning as the post-login handoff.
      try {
        window.localStorage.removeItem("quant_profile_v1");
      } catch {
        /* noop */
      }
      window.location.href = "/";
    } catch {
      setDeleteError("Network error — the account was not deleted.");
    } finally {
      setDeleting(false);
    }
  };

  if (checkedMe && me) {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Your account</p>
        <h1 className="pirate-story-line answer-title">{me.email}</h1>

        <div className="pixel-stage" style={{ maxWidth: 560 }}>
          <p className="quiz-panel-title" style={{ marginBottom: 4 }}>Profile</p>
          <p className="mm-step-hint" style={{ marginBottom: 16 }}>
            Saved to your account — it follows you to any device you sign in on.
          </p>

          <label className="onboarding-field">
            <span>Display name</span>
            <input
              type="text"
              value={editName}
              maxLength={60}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="How you appear on the leaderboard"
              autoComplete="off"
            />
          </label>

          <p className="pick-ticket-col-label" style={{ margin: "14px 0 6px" }}>CHARACTER</p>
          <div className="avatar-grid">
            {SELECTABLE_AVATARS.map((a) => (
              <button
                type="button"
                key={a.id}
                className={editAvatar === a.id ? "avatar-option is-on" : "avatar-option"}
                aria-pressed={editAvatar === a.id}
                onClick={() => setEditAvatar(a.id)}
              >
                <AvatarSprite id={a.id} />
                <span>{a.name}</span>
              </button>
            ))}
          </div>

          <p className="pick-ticket-col-label" style={{ margin: "14px 0 6px" }}>TRACKS</p>
          <div className="onboarding-choice-grid">
            {TRACKS.map((track) => (
              <button
                type="button"
                key={track.id}
                className={editTracks.includes(track.id) ? "onboarding-choice is-on" : "onboarding-choice"}
                aria-pressed={editTracks.includes(track.id)}
                onClick={() => toggleEditTrack(track.id)}
              >
                <span className="onboarding-choice-label">{track.label}</span>
                <span className="onboarding-choice-blurb">{track.blurb}</span>
              </button>
            ))}
          </div>

          <label className="onboarding-field">
            <span>Field of study</span>
            <select value={editMajor} onChange={(e) => setEditMajor(e.target.value)}>
              <option value="">Select…</option>
              {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="onboarding-field">
            <span>Stage</span>
            <select value={editExperience} onChange={(e) => setEditExperience(e.target.value)}>
              <option value="">Select…</option>
              {EXPERIENCE_LEVELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <label className="onboarding-field">
            <span>Age range</span>
            <select value={editAgeBand} onChange={(e) => setEditAgeBand(e.target.value)}>
              <option value="">Select…</option>
              {AGE_BANDS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          {saveError && (
            <p className="quiz-q-explain is-wrong" style={{ marginTop: 8 }}>{saveError}</p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <button
              type="button"
              className="continue-btn"
              disabled={saveState === "saving"}
              onClick={saveAccountProfile}
            >
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save changes"}
            </button>
            <a
              className="chip-btn"
              href={profile.personalized ? "/" : "/?login=1"}
              style={{ display: "inline-block" }}
            >
              {profile.personalized ? "Back to the arcade" : "Finish profile setup"}
            </a>
            <button type="button" className="chip-btn" disabled={submitting} onClick={logOut}>
              Log out
            </button>
          </div>
        </div>

        <div className="pixel-stage" style={{ maxWidth: 560, marginTop: 18 }}>
          <p className="quiz-panel-title" style={{ marginBottom: 4 }}>Danger zone</p>
          {!deleteOpen ? (
            <>
              <p className="mm-step-hint" style={{ marginBottom: 12 }}>
                Deleting your account removes it permanently — scores, tickets, and sign-in included.
                There is no undo.
              </p>
              <button type="button" className="chip-btn" onClick={() => setDeleteOpen(true)}>
                Delete account…
              </button>
            </>
          ) : (
            <>
              <p className="mm-step-hint" style={{ marginBottom: 12 }}>
                Enter your password to permanently delete <strong>{me.email}</strong>. This cannot
                be undone.
              </p>
              <div className="quiz-q-input-row" style={{ marginBottom: 10 }}>
                <input
                  type="password"
                  className="quiz-q-input"
                  placeholder="Your password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </div>
              {deleteError && (
                <p className="quiz-q-explain is-wrong" style={{ marginBottom: 10 }}>{deleteError}</p>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="chip-btn"
                  style={{ borderColor: "var(--pixel-bad)", color: "var(--pixel-bad)" }}
                  disabled={deleting || deletePassword.length === 0}
                  onClick={deleteAccount}
                >
                  {deleting ? "Deleting…" : "Delete my account permanently"}
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  disabled={deleting}
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeletePassword("");
                    setDeleteError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
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
