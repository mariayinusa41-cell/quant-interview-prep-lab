"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "../access/AccessContext";
import { useProgress } from "../progress/ProgressContext";
import { useSound } from "../audio/SoundProvider";
import { SKILL_LABELS } from "../progress/skills";
import { SKILL_HREF, SKILL_LAB_NAME } from "../progress/skillLinks";
import { weakestSkills } from "../progress/progression";
import { clearLastRun, readLastRun, type LastRun } from "../progress/lastRun";

// The arcade continue screen: shown on the profile only when the player has
// just finished a run, with one pre-picked next game aimed at their weakest
// skill.
//
// The countdown is a nudge, not a threat — it stops at zero and never
// navigates anywhere on its own. A timer that actually did something would
// make leaving the page feel punished, which is the opposite of the point.
export default function ContinuePanel() {
  const router = useRouter();
  const { skills } = useProgress();
  const { mode, tokens } = useAccess();
  const { playSfx } = useSound();

  const [run, setRun] = useState<LastRun | null>(null);
  const [count, setCount] = useState(9);

  // Read on mount only: sessionStorage is not reactive, and re-reading would
  // resurrect a run the player has already dismissed.
  useEffect(() => {
    setRun(readLastRun());
  }, []);

  useEffect(() => {
    if (!run) return;
    const id = window.setInterval(() => {
      setCount((c) => (c <= 0 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [run]);

  if (!run) return null;

  const [weakest] = weakestSkills(skills, 1);
  const nextHref = weakest ? SKILL_HREF[weakest.skill] : run.href;
  const nextName = weakest ? SKILL_LAB_NAME[weakest.skill] : run.game;

  const dismiss = () => {
    clearLastRun();
    setRun(null);
  };

  const insertCoin = () => {
    playSfx("confirm");
    // Deliberately does NOT spend tokens here. The destination game charges
    // on entry through its own AccessStartButton, so taking payment here as
    // well would charge twice for one run.
    clearLastRun();
    router.push(nextHref);
  };

  return (
    <section className="continue-panel">
      <div className="continue-overlay" aria-hidden="true" />

      <div className="continue-inner">
        <div className="continue-left">
          <p className="continue-eyebrow">Run complete // {run.game}</p>
          <p className="continue-title">Continue?</p>
          <p className="continue-count" aria-hidden="true">{count}</p>
          <p className="continue-result">
            <span>
              SCORE <strong>{run.total === null ? run.score : `${run.score}/${run.total}`}</strong>
            </span>
          </p>
        </div>

        <div className="continue-right">
          <p className="continue-next-label">Next run picked for you</p>
          <div className="continue-card">
            <p className="continue-card-title">{nextName}</p>
            <p className="continue-card-body">
              {weakest ? (
                <>
                  Trains <strong>{SKILL_LABELS[weakest.skill]}</strong>, your weakest skill right now.
                </>
              ) : (
                <>Another round of {run.game}.</>
              )}
            </p>
          </div>

          <div className="continue-actions">
            <button type="button" className="continue-coin" onClick={insertCoin}>
              Insert coin
            </button>
            <button type="button" className="continue-ghost" onClick={dismiss}>
              Not now
            </button>
          </div>
          <p className="continue-price">
            {mode === "free" ? `${tokens} tokens in your wallet` : "Unlimited play"}
          </p>
        </div>
      </div>
    </section>
  );
}
