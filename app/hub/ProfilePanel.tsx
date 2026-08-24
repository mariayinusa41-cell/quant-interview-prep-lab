"use client";

import { useAccess } from "../access/AccessContext";
import { useProfile } from "../profile/ProfileContext";
import { useProgress } from "../progress/ProgressContext";
import { AvatarSprite } from "../profile/avatars";
import { buildAchievements } from "../profile/achievements";
import { TRACK_BY_ID } from "../profile/tracks";
import { STREAK_TARGET } from "../daily/challengeBank";
import TokenIcon from "../access/TokenIcon";
import TicketIcon from "../progress/TicketIcon";
import GiftBox from "../access/GiftBox";

const PASS_LABEL: Record<string, string> = {
  developer: "Developer",
  free: "Free player",
  infinity: "Infinity Pass",
};

export default function ProfilePanel() {
  const { mode, tokens } = useAccess();
  const { profile } = useProfile();
  const { tickets, accuracy, graded } = useProgress();

  const achievements = buildAchievements({ tickets, accuracy, graded, profile });
  const earned = achievements.filter((a) => a.earned).length;

  return (
    <div className="hub-panel">
      <section className="section profile-card">
        <div className="profile-head">
          <div className="profile-avatar">
            <AvatarSprite id={profile.avatar} />
          </div>
          <div className="profile-id">
            <h2 className="profile-name">
              {profile.displayName.trim() || "Unnamed player"}
              <GiftBox />
            </h2>
            <p className="profile-sub">
              {profile.account === "guest" ? "Guest session" : "Signed in"}
              {profile.experience ? ` · ${profile.experience}` : ""}
              {profile.major ? ` · ${profile.major}` : ""}
            </p>
            <p className="profile-tracks">
              {profile.tracks.length > 0
                ? profile.tracks.map((id) => TRACK_BY_ID[id]?.label).filter(Boolean).join(" · ")
                : "No track selected"}
            </p>
          </div>
          <span className={mode === "infinity" ? "profile-pass is-inf" : "profile-pass"}>
            {PASS_LABEL[mode] ?? mode}
          </span>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-icon"><TicketIcon /></span>
            <strong>{tickets}</strong>
            <span>Tickets</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-icon profile-stat-acc" aria-hidden="true" />
            <strong>{accuracy === null ? "--" : `${accuracy}%`}</strong>
            <span>Accuracy</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-icon"><TokenIcon /></span>
            <strong>{mode === "free" ? tokens : "∞"}</strong>
            <span>Tokens</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-icon" aria-hidden="true">🔥</span>
            <strong>{profile.streak}</strong>
            <span>Day streak</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-icon" aria-hidden="true">?</span>
            <strong>{graded}</strong>
            <span>Questions</span>
          </div>
        </div>

        <div className="profile-streak-bar" aria-label={`Login streak ${profile.streak} days`}>
          {Array.from({ length: STREAK_TARGET }).map((_, i) => {
            const filled = profile.streak % STREAK_TARGET === 0 && profile.streak > 0
              ? true
              : i < profile.streak % STREAK_TARGET;
            return <span key={i} className={filled ? "daily-pip is-on" : "daily-pip"} />;
          })}
          <span className="profile-streak-note">
            {STREAK_TARGET - (profile.streak % STREAK_TARGET || STREAK_TARGET)} day(s) to your next spin
          </span>
        </div>
      </section>

      <section className="section">
        <h2>Achievements</h2>
        <p className="section-intro">{earned} of {achievements.length} earned.</p>
        <div className="ach-grid">
          {achievements.map((a) => (
            <div className={a.earned ? "ach-card is-earned" : "ach-card"} key={a.id}>
              <span className="ach-icon" aria-hidden="true">{a.icon}</span>
              <span className="ach-body">
                <strong>{a.name}</strong>
                <span>{a.detail}</span>
                {!a.earned && a.progress !== undefined && (
                  <span className="ach-bar"><span style={{ width: `${Math.round(a.progress * 100)}%` }} /></span>
                )}
              </span>
              <span className="ach-state">{a.earned ? "EARNED" : "LOCKED"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
