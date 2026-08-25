"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TrackId } from "./tracks";
import type { AvatarId } from "./avatars";
import { daysBetween, todayKey } from "../daily/challengeBank";

export type AccountKind = "guest" | "account";

export type Profile = {
  account: AccountKind;
  displayName: string;
  avatar: AvatarId;
  tracks: TrackId[];
  major: string;
  experience: string;
  ageBand: string;
  onboarded: boolean;
  /**
   * True only after the avatar/tracks/about steps have actually been
   * completed. `onboarded` alone can't tell the difference between "finished
   * the full flow" and "skipped in as a guest" — and that ambiguity is how a
   * guest who later signed up on /login ended up with an account but no
   * avatar, no tracks and no way to ever be asked again.
   */
  personalized: boolean;
  /** Day-key of the last daily challenge attempt (one attempt per day). */
  dailyAttempted: string;
  /** Consecutive days seen, used for the 7-day wheel spin. */
  streak: number;
  lastSeen: string;
  /** Streak length already cashed in, so one spin is not claimed twice. */
  spinClaimedAt: number;
};

const PROFILE_KEY = "quant_profile_v1";

const EMPTY: Profile = {
  account: "guest",
  displayName: "",
  avatar: "duck",
  tracks: [],
  major: "",
  experience: "",
  ageBand: "",
  onboarded: false,
  personalized: false,
  dailyAttempted: "",
  streak: 0,
  lastSeen: "",
  spinClaimedAt: 0,
};

type ProfileContextValue = {
  profile: Profile;
  /** False until localStorage has been read, so nothing renders on a guess. */
  ready: boolean;
  saveProfile: (patch: Partial<Profile>) => void;
  completeOnboarding: (patch: Partial<Profile>) => void;
  /** Re-opens the sign-in / onboarding flow without wiping tickets or tokens. */
  restartOnboarding: () => void;
  resetProfile: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Profile>;
        const restored: Profile = {
          ...EMPTY,
          ...parsed,
          account: parsed.account === "account" ? "account" : "guest",
          // Profiles saved before `personalized` existed: anyone who picked
          // tracks or a name went through the full flow; an instant guest
          // has neither.
          personalized:
            typeof parsed.personalized === "boolean"
              ? parsed.personalized
              : (parsed.tracks?.length ?? 0) > 0 ||
                (!!parsed.displayName && parsed.displayName !== "Guest"),
          tracks: Array.isArray(parsed.tracks) ? (parsed.tracks as TrackId[]) : [],
          onboarded: parsed.onboarded === true,
        };

        // Streak is advanced on load: +1 for a consecutive day, reset to 1
        // after a gap, unchanged on a same-day revisit.
        const today = todayKey();
        if (restored.lastSeen !== today) {
          const gap = daysBetween(restored.lastSeen, today);
          restored.streak = gap === 1 ? restored.streak + 1 : 1;
          restored.lastSeen = today;
          if (restored.streak === 1) restored.spinClaimedAt = 0;
        }

        setProfile(restored);
        return;
      }
    } catch {
      setProfile(EMPTY);
    } finally {
      setReady(true);
    }
  }, []);

  // Reconcile the local profile with the real session. The account flag
  // used to be local-only, so signing up on /login left the profile saying
  // "guest" forever — which blocked the daily challenge and mislabelled the
  // profile card even though a session cookie existed. One fetch on mount
  // fixes both directions: a live session promotes, a definitive "no
  // session" answer demotes an expired one. A network failure does neither.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { user: { displayName: string | null } | null } | null) => {
        if (cancelled || data === null) return; // request failed: change nothing
        setProfile((prev) => {
          if (data.user) {
            const serverName = data.user.displayName ?? "";
            const keepLocal = prev.displayName && prev.displayName !== "Guest";
            const next = {
              ...prev,
              account: "account" as const,
              displayName: keepLocal ? prev.displayName : serverName || prev.displayName,
            };
            return next.account === prev.account && next.displayName === prev.displayName ? prev : next;
          }
          return prev.account === "account" ? { ...prev, account: "guest" as const } : prev;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Run once when the stored profile is ready — not on every profile edit.
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* storage unavailable — profile stays in memory for this session */
    }
  }, [profile, ready]);

  const saveProfile = (patch: Partial<Profile>) => setProfile((prev) => ({ ...prev, ...patch }));
  const completeOnboarding = (patch: Partial<Profile>) =>
    setProfile((prev) => ({ ...prev, ...patch, onboarded: true, streak: Math.max(1, prev.streak), lastSeen: todayKey() }));
  // Only flips the flag: progress, tokens, and the chosen avatar all survive,
  // so re-opening the sign-in screen is non-destructive.
  const restartOnboarding = () => setProfile((prev) => ({ ...prev, onboarded: false }));
  const resetProfile = () => setProfile(EMPTY);

  const value = useMemo(
    () => ({ profile, ready, saveProfile, completeOnboarding, restartOnboarding, resetProfile }),
    [profile, ready],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
