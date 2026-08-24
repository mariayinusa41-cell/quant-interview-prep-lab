"use client";

import { useState } from "react";
import { useSound } from "../audio/SoundProvider";
import AccessModePicker from "../access/AccessModePicker";
import ProfilePanel from "./ProfilePanel";
import ArcadePanel from "./ArcadePanel";
import JobsPanel from "./JobsPanel";
import NewsPanel from "./NewsPanel";
import AssessmentBoard from "../assessments/AssessmentBoard";
import MockInterviewBoard from "../assessments/MockInterviewBoard";
import Leaderboard from "../leaderboard/Leaderboard";
import InterviewQuestionsPanel from "./InterviewQuestionsPanel";

// Category tabs rather than one long scroll: each area of the product gets
// its own screen, so the hub stays navigable as more is added.
type TabId = "arcade" | "profile" | "assessments" | "questions" | "mock" | "leaderboard" | "jobs" | "news";

const TABS: { id: TabId; label: string }[] = [
  { id: "arcade", label: "Enter Arcade" },
  { id: "profile", label: "My Profile" },
  { id: "assessments", label: "Assessments" },
  { id: "questions", label: "Interview Questions" },
  { id: "mock", label: "Mock Interview" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "jobs", label: "My Jobs" },
  { id: "news", label: "News" },
];

export default function Hub() {
  // Profile is the default landing screen.
  const [tab, setTab] = useState<TabId>("profile");
  const { playSfx } = useSound();

  const select = (id: TabId) => {
    setTab(id);
    playSfx("select");
  };

  return (
    <>
      <header className="hub-header">
        <h1 className="hub-wordmark">Quant Interview Prep Lab</h1>
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
              ].filter(Boolean).join(" ")}
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => select(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "arcade" && <ArcadePanel />}
      {tab === "profile" && <ProfilePanel />}
      {tab === "assessments" && <div className="hub-panel"><AssessmentBoard /></div>}
      {tab === "questions" && <InterviewQuestionsPanel />}
      {tab === "mock" && <div className="hub-panel"><MockInterviewBoard /></div>}
      {tab === "leaderboard" && <div className="hub-panel"><Leaderboard /></div>}
      {tab === "jobs" && <JobsPanel />}
      {tab === "news" && <NewsPanel />}

      <div className="hub-panel">
        <AccessModePicker />
      </div>

      <footer className="site-footer">
        <p>
          Study structure follows the topic organization of <em>A Practical Guide to Quantitative
          Finance Interviews</em>. Games, prompts, and explanations are original; the book&rsquo;s
          protected solutions and passages are not reproduced.
        </p>
      </footer>
    </>
  );
}
