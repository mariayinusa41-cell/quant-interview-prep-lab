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
  // Null until mounted: the countdown depends on the clock, so rendering it
  // during SSR would disagree with the browser and trip a hydration mismatch.
  const [countdown, setCountdown] = useState<string | null>(null);

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
    <section className="arc-hero is-plain" aria-label="Daily challenge">
      <div className="arc-marquee">
        <span className="arc-marquee-text">Daily challenge &mdash; cabinet of the day</span>
      </div>

      <div className="arc-hero-split">
        <div>
          <p className="arc-eyebrow">
            {SKILL_LABELS[question.skill]} {"//"} 1 question &middot; resets 00:00 UTC
          </p>
          {/* Showing the question up front is most of the win here — it used
              to take a click to find out what you were even being asked. */}
          <p className="arc-daily-q">{question.prompt}</p>
          <div className="arc-stat-row">
            <span>
              REWARD <strong className="is-reward">+{DAILY_REWARD} tokens</strong>
            </span>
            <span>
              EXPIRES IN <strong className="is-expiry">{countdown ?? "--:--:--"}</strong>
            </span>
          </div>
        </div>

        <div className="arc-daily-side">
          <div className="arc-coins" aria-label={`Streak: ${profile.streak} days`}>
            {Array.from({ length: STREAK_TARGET }).map((_, i) => (
              <span
                key={i}
                className={
                  i < filled
                    ? i === filled - 1
                      ? "arc-coin is-on is-today"
                      : "arc-coin is-on"
                    : "arc-coin"
                }
                aria-hidden="true"
              >
                <TokenIcon />
              </span>
            ))}
          </div>
          <p className="arc-spin-line">
            {spinAvailable
              ? "You've earned a free prize spin — take it."
              : daysToSpin === STREAK_TARGET
                ? `Day ${filled} of ${STREAK_TARGET} — ${STREAK_TARGET} more for a free prize spin.`
                : `Day ${filled} of ${STREAK_TARGET} — ${daysToSpin} more for a free prize spin.`}
          </p>

          {isGuest ? null : spinAvailable ? (
            <button type="button" className="arc-cta" disabled={spinning} onClick={spin}>
              {spinning ? "Spinning…" : spinResult !== null ? `Won ${spinResult}!` : "Spin the wheel"}
            </button>
          ) : (
            <button
              type="button"
              className="arc-cta"
              disabled={showChoices}
              onClick={() => setRevealed(true)}
            >
              {alreadyDone && !answered ? "Answered today" : "Play today's challenge"}
            </button>
          )}
        </div>
      </div>

      <div className="arc-hero-body" style={{ paddingTop: 0 }}>
        {isGuest ? (
          <p className="daily-locked">
            The daily challenge is the main way a free player earns tokens — it needs an account.
            Guests can still play every always-free game without limit.
          </p>
        ) : (
          <>
            {showChoices && (
              <div className={answered ? (gotItRight ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                {alreadyDone && !answered ? (
                  <p className="daily-done">Already answered today. A new question unlocks tomorrow.</p>
                ) : (
                  <div className="lab-choice-grid">
                    {question.choices.map((choice, i) => (
                      <button
                        type="button"
                        key={choice}
                        disabled={answered || alreadyDone}
                        className={
                          !answered
                            ? "lab-choice"
                            : i === question.answer
                              ? "lab-choice is-answer"
                              : i === picked
                                ? "lab-choice is-selected"
                                : "lab-choice"
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
                  <p className={gotItRight ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                    {gotItRight ? `Correct — +${DAILY_REWARD} tokens. ` : "Not quite. "}
                    {question.explanation}
                  </p>
                )}
              </div>
            )}

            {spinResult !== null && (
              <p className="quiz-q-explain is-correct">Wheel paid out {spinResult} tokens.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
