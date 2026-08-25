"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccess } from "../access/AccessContext";
import { useProfile } from "../profile/ProfileContext";
import { useProgress } from "../progress/ProgressContext";
import { SKILL_LABELS } from "../progress/skills";
import {
  DAILY_REWARD,
  STREAK_TARGET,
  WHEEL_PRIZES,
  questionForDay,
  todayKey,
} from "./challengeBank";
import TokenIcon from "../access/TokenIcon";

const OPEN_KEY = "outcry_daily_open";

/** ms until the next UTC midnight, which is when a new question unlocks. */
function msUntilUtcMidnight(): number {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return next - now.getTime();
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function DailyChallenge() {
  const { grantTokens, mode } = useAccess();
  const { profile, saveProfile } = useProfile();
  const { recordAttempt } = useProgress();

  const today = todayKey();
  const question = useMemo(() => questionForDay(today), [today]);

  const [picked, setPicked] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  // Collapsed by default — on the profile tab this sits among several other
  // cards, and an open quiz is the tallest thing there. The choice is
  // remembered so it doesn't re-collapse on every visit.
  const [open, setOpen] = useState(false);
  // Null until mounted: the countdown depends on the clock, so rendering it
  // during SSR would disagree with the browser and trip a hydration mismatch.
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(OPEN_KEY) === "1") setOpen(true);
    } catch {
      /* storage unavailable — stay collapsed */
    }
  }, []);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
      } catch {
        /* noop */
      }
      return next;
    });
  };

  useEffect(() => {
    const tick = () => setCountdown(formatCountdown(msUntilUtcMidnight()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const alreadyDone = profile.dailyAttempted === today;
  const isGuest = profile.account === "guest";
  // The wheel is owed once per completed 7-day block.
  const spinBlock = Math.floor(profile.streak / STREAK_TARGET);
  const spinAvailable = spinBlock > 0 && profile.spinClaimedAt < spinBlock;

  function choose(index: number) {
    if (picked !== null || alreadyDone || isGuest) return;
    const correct = index === question.answer;
    setPicked(index);
    // Graded like any other question, and the only earned-token path.
    recordAttempt(question.skill, correct ? "correct" : "incorrect");
    saveProfile({ dailyAttempted: today });
    if (correct && mode === "free") grantTokens(DAILY_REWARD);
  }

  function spin() {
    // isGuest is checked here as well as in the render. The button is
    // hidden from guests, but this function is what actually grants
    // tokens, and guests are not meant to hold any — a guard on the
    // payout is worth more than a guard on the button.
    if (!spinAvailable || spinning || isGuest) return;
    setSpinning(true);
    // Short delay purely so the payout reads as a spin rather than a jump.
    window.setTimeout(() => {
      const prize = WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)];
      setSpinResult(prize);
      if (mode === "free") grantTokens(prize);
      saveProfile({ spinClaimedAt: spinBlock });
      setSpinning(false);
    }, 700);
  }

  const answered = picked !== null;
  const gotItRight = answered && picked === question.answer;
  const showChoices = revealed || answered || alreadyDone;

  // Coin row: one slot per day of the streak block, so a 7-day run fills it.
  const filled = profile.streak === 0 ? 0 : profile.streak % STREAK_TARGET || STREAK_TARGET;
  const daysToSpin = STREAK_TARGET - filled;

  return (
    <section className="section daily-card" aria-label="Daily challenge">
      {/* The heading itself is the control, so the accordion has one
          keyboard target rather than a heading plus a stray button. */}
      <h2 className="daily-card-heading">
        <button
          type="button"
          className="daily-card-toggle"
          aria-expanded={open}
          aria-controls="daily-challenge-body"
          onClick={toggleOpen}
        >
          <span className="daily-card-title">Daily challenge</span>
          <span className="daily-card-meta">
            {/* Collapsed, this status is the only thing telling you whether
                there is anything left to do today. */}
            {!isGuest && (
              <span className={alreadyDone || answered ? "daily-card-status is-done" : "daily-card-status"}>
                {alreadyDone || answered ? "Done" : `+${DAILY_REWARD}`}
              </span>
            )}
            <span className="daily-card-topic">{SKILL_LABELS[question.skill]}</span>
            <span className="daily-card-timer">{countdown ?? "--:--:--"}</span>
            <span className={open ? "daily-card-chev is-open" : "daily-card-chev"} aria-hidden="true">
              &#9662;
            </span>
          </span>
        </button>
      </h2>

      <div id="daily-challenge-body" hidden={!open}>
      {isGuest ? (
        <p className="daily-locked">
          The daily challenge is the main way a free player earns tokens — it needs an account.
          Guests can still play every always-free game without limit.
        </p>
      ) : (
        <>
          <div className="daily-card-row">
            {/* Coins are the streak at a glance; small, not a feature block. */}
            <span className="daily-card-coins" aria-label={`Streak: ${profile.streak} days`}>
              {Array.from({ length: STREAK_TARGET }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < filled
                      ? i === filled - 1
                        ? "daily-coin is-on is-today"
                        : "daily-coin is-on"
                      : "daily-coin"
                  }
                  aria-hidden="true"
                />
              ))}
            </span>
            <span className="daily-card-reward">
              <TokenIcon /> +{DAILY_REWARD}
            </span>
          </div>

          <p className="daily-card-q">{question.prompt}</p>

          {!showChoices ? (
            <div className="daily-card-actions">
              <button type="button" className="daily-card-btn" onClick={() => setRevealed(true)}>
                Answer today&rsquo;s question
              </button>
              {spinAvailable && (
                <button type="button" className="daily-card-btn is-spin" disabled={spinning} onClick={spin}>
                  {spinning ? "Spinning…" : spinResult !== null ? `Won ${spinResult}!` : "Free spin"}
                </button>
              )}
            </div>
          ) : alreadyDone && !answered ? (
            <p className="daily-card-done">Already answered today. A new question unlocks tomorrow.</p>
          ) : (
            <div className="daily-card-choices">
              {question.choices.map((choice, i) => (
                <button
                  type="button"
                  key={choice}
                  disabled={answered || alreadyDone}
                  className={
                    !answered
                      ? "daily-choice"
                      : i === question.answer
                        ? "daily-choice is-answer"
                        : i === picked
                          ? "daily-choice is-selected"
                          : "daily-choice"
                  }
                  onClick={() => choose(i)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {choice}
                </button>
              ))}
            </div>
          )}

          {answered && (
            <p className={gotItRight ? "daily-card-explain is-correct" : "daily-card-explain is-wrong"}>
              {gotItRight ? `Correct — +${DAILY_REWARD} tokens. ` : "Not quite. "}
              {question.explanation}
            </p>
          )}

          {spinResult !== null && (
            <p className="daily-card-explain is-correct">Wheel paid out {spinResult} tokens.</p>
          )}

          {!showChoices && !spinAvailable && (
            <p className="daily-card-streak">
              Day {filled} of {STREAK_TARGET} — {daysToSpin} more for a free prize spin.
            </p>
          )}
        </>
      )}
      </div>
    </section>
  );
}
