"use client";

import { useEffect, useState } from "react";
import { useSound } from "../audio/SoundProvider";
import { OutcryMegaphoneLogo } from "../OutcryMegaphoneLogo";
import AccessModePicker from "../access/AccessModePicker";
import AccountBadge from "../access/AccountBadge";
import ProfilePanel from "./ProfilePanel";
import ArcadePanel from "./ArcadePanel";
import JobsPanel from "./JobsPanel";
import NewsPanel from "./NewsPanel";
import AssessmentBoard from "../assessments/AssessmentBoard";
import MockInterviewBoard from "../assessments/MockInterviewBoard";
import Leaderboard from "../leaderboard/Leaderboard";
import SiteFooter from "../SiteFooter";

// Category tabs rather than one long scroll: each area of the product gets
// its own screen, so the hub stays navigable as more is added.
// "questions" (Interview Questions) is hidden for now — the panel and its
// scraper still exist (InterviewQuestionsPanel.tsx, quant_scraper.py) but
// aren't linked from the nav, so re-enabling it later is a one-line change.
type TabId = "arcade" | "profile" | "assessments" | "mock" | "leaderboard" | "jobs" | "news";
const TAB_IDS: TabId[] = ["arcade", "profile", "assessments", "mock", "leaderboard", "jobs", "news"];
const LAST_TAB_KEY = "quant_hub_last_tab";

const TABS: { id: TabId; label: string; comingSoon?: boolean }[] = [
  { id: "arcade", label: "Enter Arcade" },
  { id: "profile", label: "My Profile" },
  { id: "assessments", label: "Assessments" },
  { id: "mock", label: "Mock Interview", comingSoon: true },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "jobs", label: "My Jobs" },
  { id: "news", label: "News" },
];

export default function Hub() {
  // Profile is the default landing screen — but only on a genuinely fresh
  // session. Without this, clicking into any lab and then hitting browser
  // back always dropped you back on "My Profile" instead of wherever you
  // actually were (usually "Enter Arcade"), since `tab` was plain in-memory
  // state that reset to its default on every remount. sessionStorage
  // survives that remount without following the player across days.
  const [tab, setTabState] = useState<TabId>("profile");
  const { playSfx } = useSound();

  useEffect(() => {
    const saved = window.sessionStorage.getItem(LAST_TAB_KEY);
    if (saved && (TAB_IDS as string[]).includes(saved)) setTabState(saved as TabId);
  }, []);

  const setTab = (id: TabId) => {
    setTabState(id);
    window.sessionStorage.setItem(LAST_TAB_KEY, id);
  };

  const select = (id: TabId) => {
    setTab(id);
    playSfx("select");
  };

  return (
    <>
      <header className="hub-header">
        <div className="hub-header-top">
          <span className="hub-header-spacer" aria-hidden="true" />
          <h1 className="hub-wordmark hub-wordmark-row">
            <OutcryMegaphoneLogo size={28} />
            Outcry
          </h1>
          <AccountBadge />
        </div>
        <nav className="hub-nav" aria-label="Main sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={[
                "hub-tab",
                // The arcade tab is the primary call to action, so it gets its
                // own red attract-mode treatment rather than the neutral chrome.
                t.id === "arcade" ? "is-arcade" : "",
                tab === t.id ? "is-on" : "",
                t.comingSoon ? "is-coming-soon" : "",
              ].filter(Boolean).join(" ")}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => select(t.id)}
            >
              {t.label}
              {t.comingSoon && <span className="hub-tab-soon">SOON</span>}
            </button>
          ))}
        </nav>
      </header>

      {tab === "arcade" && <ArcadePanel />}
      {tab === "profile" && <ProfilePanel />}
      {tab === "assessments" && <div className="hub-panel"><AssessmentBoard /></div>}
      {tab === "mock" && (
        <div className="hub-panel">
          <section className="section">
            <h2>Mock Interview</h2>
            <p className="section-intro">
              An interviewer asks, you answer, and they push back on the reasoning — closer to the real thing than a
              multiple-choice screen.
            </p>
            <div className="coming-soon-card">
              <p className="coming-soon-title">Coming soon</p>
            </div>
            <div className="coming-soon-preview" aria-hidden="true">
              <MockInterviewBoard />
            </div>
          </section>
        </div>
      )}
      {tab === "leaderboard" && <div className="hub-panel"><Leaderboard /></div>}
      {tab === "jobs" && <JobsPanel />}
      {tab === "news" && <NewsPanel />}

      <div className="hub-panel">
        <AccessModePicker />
      </div>

      <SiteFooter />
    </>
  );
}
