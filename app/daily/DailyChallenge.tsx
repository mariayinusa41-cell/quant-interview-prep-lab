"use client";

import { useMemo, useState } from "react";
import { useAccess } from "../access/AccessContext";
import { useProfile } from "../profile/ProfileContext";
import { useProgress } from "../progress/ProgressContext";
import {
  DAILY_REWARD,
  STREAK_TARGET,
  WHEEL_PRIZES,
  questionForDay,
  todayKey,
} from "./challengeBank";
import TokenIcon from "../access/TokenIcon";

export default function DailyChallenge() {
  const { grantTokens, mode } = useAccess();
  const { profile, saveProfile } = useProfile();
  const { recordAttempt } = useProgress();

  const today = todayKey();
  const question = useMemo(() => questionForDay(today), [today]);

  const [picked, setPicked] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);

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
    if (!spinAvailable || spinning) return;
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

  return (
    <section className="section daily-section">
      <h2>Daily Challenge</h2>

      <div className="daily-meta">
        <span className="daily-streak">
          STREAK <strong>{profile.streak}</strong>
          <span className="daily-pips" aria-hidden="true">
            {Array.from({ length: STREAK_TARGET }).map((_, i) => (
              <span key={i} className={i < profile.streak % STREAK_TARGET || (profile.streak > 0 && profile.streak % STREAK_TARGET === 0) ? "daily-pip is-on" : "daily-pip"} />
            ))}
          </span>
        </span>
        <span className="daily-reward">
          <TokenIcon /> +{DAILY_REWARD} for a correct answer
        </span>
      </div>

      {isGuest ? (
        <p className="daily-locked">
          The daily challenge is the main way a free player earns tokens — it needs an account.
          Guests can still play every always-free game without limit.
        </p>
      ) : (
        <>
          <div className={answered ? (gotItRight ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
            <p className="quiz-q-prompt">{question.prompt}</p>

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

          <div className="daily-wheel">
            <div>
              <strong>{STREAK_TARGET}-day streak spin</strong>
              <span>
                {spinAvailable
                  ? "You've earned a spin — take it."
                  : `Log in ${STREAK_TARGET - (profile.streak % STREAK_TARGET || STREAK_TARGET)} more day(s) in a row to spin.`}
              </span>
            </div>
            <button
              type="button"
              className="onboarding-btn is-primary"
              disabled={!spinAvailable || spinning}
              onClick={spin}
            >
              {spinning ? "Spinning…" : spinResult !== null ? `Won ${spinResult}!` : "Spin"}
            </button>
          </div>
          {spinResult !== null && (
            <p className="quiz-q-explain is-correct">Wheel paid out {spinResult} tokens.</p>
          )}
        </>
      )}
    </section>
  );
}
