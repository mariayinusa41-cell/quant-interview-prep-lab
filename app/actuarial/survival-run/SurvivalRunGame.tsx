"use client";

import { useEffect, useRef, useState } from "react";
import TeX from "../../math/TeX";
import {
  annuityDue,
  discount,
  expectedPayment,
  improveMortality,
  kSurvival,
  survivalOneYear,
  type MortalityTable,
} from "../survivalMath";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";

// Ages 65-84. Mortality accelerates with age, which is what makes the later
// hurdles visibly taller and the survival curve fall away.
const TABLE: MortalityTable = {
  startAge: 65,
  q: [
    0.012, 0.013, 0.015, 0.016, 0.018, 0.020, 0.023, 0.025, 0.028, 0.032,
    0.036, 0.041, 0.047, 0.053, 0.060, 0.068, 0.077, 0.087, 0.098, 0.111,
  ],
};

const YEARS = TABLE.q.length;
const RATE = 0.04;
const PAYMENT = 20000;
const IMPROVEMENT = 0.75; // mortality falls 25%
const BOOK = 1000;        // policies in the book
const STEP_MS = 260;

type Checkpoint = {
  atYear: number;
  prompt: string;
  formula: string;
  hint: string;
  answer: number;
  tolerance: number;
  decimals: number;
  skill: "distributions" | "expected-value";
  explain: (v: string) => string;
};

const CHECKPOINTS: Checkpoint[] = [
  {
    atYear: 1,
    prompt: "First hurdle — what is the chance this cohort clears age 65?",
    formula: "p₆₅ = 1 − q₆₅",
    hint: "q₆₅ = 0.012.",
    answer: survivalOneYear(TABLE.q[0]),
    tolerance: 0.0005,
    decimals: 4,
    skill: "distributions",
    explain: (v) =>
      `p₆₅ = 1 − 0.012 = ${v}. One year is easy. The reason annuities are hard is that these have to be multiplied together, not added.`,
  },
  {
    atYear: 3,
    prompt: "Three hurdles cleared — what is the chance of surviving all three?",
    formula: "₃p₆₅ = p₆₅ × p₆₆ × p₆₇",
    hint: "q = 0.012, 0.013, 0.015 for ages 65, 66, 67.",
    answer: kSurvival(TABLE, 3),
    tolerance: 0.0015,
    decimals: 6,
    skill: "distributions",
    explain: (v) =>
      `₃p₆₅ = 0.988 × 0.987 × 0.985 = ${v}. Survival compounds multiplicatively — this is why a small annual improvement moves a long-dated liability so much more than it first appears.`,
  },
  {
    atYear: 8,
    prompt: "Year 8 — what is that year's payment worth to you today?",
    formula: "EPV₈ = v⁸ × ₈p₆₅ × payment",
    hint: `₈p₆₅ = ${kSurvival(TABLE, 8).toFixed(6)}, v⁸ = ${discount(RATE, 8).toFixed(6)}, payment = ${PAYMENT.toLocaleString()}.`,
    answer: expectedPayment(TABLE, RATE, 8, PAYMENT),
    tolerance: 60,
    decimals: 2,
    skill: "expected-value",
    explain: (v) =>
      `${discount(RATE, 8).toFixed(6)} × ${kSurvival(TABLE, 8).toFixed(6)} × ${PAYMENT.toLocaleString()} = ${v}. Two discounts stack: one for time, one for the chance nobody is alive to collect.`,
  },
  {
    atYear: YEARS,
    prompt: "The run is over. Price the whole annuity.",
    formula: "ä = Σ (k=0…19) vᵏ × ₖp₆₅ × payment",
    hint: "Payments are due at the start of each year, so k starts at 0 and the first one is certain.",
    answer: annuityDue(TABLE, RATE, YEARS, PAYMENT),
    tolerance: 900,
    decimals: 2,
    skill: "expected-value",
    explain: (v) =>
      `The EPV is ${v} per policy. Note the k = 0 term is exactly 1 × payment — an annuity-due pays immediately, so the first payment carries no discount and no mortality.`,
  },
];

type Phase = "brief" | "running" | "checkpoint" | "shock" | "done";

export default function SurvivalRunGame() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();

  const [phase, setPhase] = useState<Phase>("brief");
  const [year, setYear] = useState(0);
  const [cpIndex, setCpIndex] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [lastOk, setLastOk] = useState(false);
  const [score, setScore] = useState(0);
  const [tripped, setTripped] = useState(0);

  const [shockInput, setShockInput] = useState("");
  const [shockChecked, setShockChecked] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const shockedTable = improveMortality(TABLE, IMPROVEMENT);
  const baseEPV = annuityDue(TABLE, RATE, YEARS, PAYMENT);
  const shockEPV = annuityDue(shockedTable, RATE, YEARS, PAYMENT);
  const shortfall = shockEPV - baseEPV;

  const current = CHECKPOINTS[cpIndex];
  const nextCheckpointYear = current?.atYear ?? YEARS;

  // The runner advances one year at a time and halts at each checkpoint. The
  // distance covered is the survival curve, not a decoration on top of it.
  useEffect(() => {
    if (phase !== "running") return;
    if (year >= nextCheckpointYear) {
      setPhase("checkpoint");
      return;
    }
    timerRef.current = setTimeout(() => setYear((y) => y + 1), STEP_MS);
    return () => clearTimeout(timerRef.current);
  }, [phase, year, nextCheckpointYear]);

  const start = () => {
    setPhase("running");
    startMusic("game");
  };

  function checkAnswer() {
    if (checked) return;
    const g = Number(input);
    const ok = input.trim() !== "" && Math.abs(g - current.answer) <= current.tolerance;
    recordAttempt(current.skill, ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 2);
    else setTripped((t) => t + 1);
    setLastOk(ok);
    setChecked(true);
  }

  function continueRun() {
    setInput("");
    setChecked(false);
    if (cpIndex + 1 >= CHECKPOINTS.length) {
      setPhase("shock");
      return;
    }
    setCpIndex((i) => i + 1);
    setPhase("running");
  }

  function checkShock() {
    if (shockChecked) return;
    const g = Number(shockInput);
    const ok = shockInput.trim() !== "" && Math.abs(g - shortfall) <= 900;
    recordAttempt("expected-value", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 3);
    setShockChecked(true);
  }

  function restart() {
    setPhase("running");
    setYear(0); setCpIndex(0);
    setInput(""); setChecked(false);
    setShockInput(""); setShockChecked(false);
    setScore(0); setTripped(0);
  }

  const survival = kSurvival(TABLE, Math.min(year, YEARS));
  const age = TABLE.startAge + Math.min(year, YEARS);

  if (phase === "brief") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">You sold this annuity. Now find out what you actually owe.</p>
          <p>
            A cohort aged 65 collects {PAYMENT.toLocaleString()} a year for up to {YEARS} years. Each
            year is a hurdle, and the hurdles get taller as mortality rises. How far the runner gets
            <em> is</em> the survival curve — and what you owe is that curve, discounted.
          </p>
          <div className="lab-topic-grid">
            {[
              ["q ₓ / p ₓ", "one year at a time"],
              ["ₖp ₓ", "survival compounds"],
              ["DISCOUNTING", "time and mortality"],
              ["LONGEVITY RISK", "living longer costs you"],
            ].map(([t, s]) => <div key={t}><strong>{t}</strong><span>{s}</span></div>)}
          </div>
          <p className="mm-step-hint">
            Interview lens: an annuity writer is short longevity. Every improvement in mortality —
            every good news story about medicine — makes this liability bigger.
          </p>
          <AccessStartButton
            gameId="actuarial-survival-run"
            title="Survival Run"
            defaultLabel="Start the run"
            className="continue-btn"
            onStart={start}
          >
            Start the run
          </AccessStartButton>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <div className="lab-hud">
        <span>AGE <strong>{age}</strong></span>
        <span>YEAR <strong>{Math.min(year, YEARS)}/{YEARS}</strong></span>
        <span>SCORE <strong>{score}</strong></span>
        <span>TRIPS <strong>{tripped}</strong></span>
      </div>

      {/* ---------- The track: distance covered IS the survival curve ---------- */}
      <div className="sr-track" aria-label={`Runner at age ${age}, survival ${(survival * 100).toFixed(1)} percent`}>
        <div className="sr-hurdles">
          {TABLE.q.map((q, i) => (
            <span
              key={i}
              className={
                i < year ? "sr-hurdle is-cleared" : i === year ? "sr-hurdle is-next" : "sr-hurdle"
              }
              // Hurdle height is the year's mortality rate, scaled for display.
              style={{ height: `${8 + q * 240}px` }}
              title={`Age ${TABLE.startAge + i} · q = ${q.toFixed(3)}`}
            />
          ))}
        </div>
        <div className="sr-runner-lane">
          <span
            className={phase === "checkpoint" && checked && !lastOk ? "sr-runner is-tripped" : "sr-runner"}
            style={{ left: `${(Math.min(year, YEARS) / YEARS) * 100}%` }}
            aria-hidden="true"
          >
            {phase === "checkpoint" && checked && !lastOk ? "✖" : "▶"}
          </span>
        </div>
        <div className="sr-axis">
          <span>65</span><span>70</span><span>75</span><span>80</span><span>84</span>
        </div>
      </div>

      <div className="sr-survival">
        <span>Still alive at {age}</span>
        <span className="sr-bar"><span style={{ width: `${survival * 100}%` }} /></span>
        <strong>{(survival * 100).toFixed(1)}%</strong>
      </div>

      {phase === "running" && (
        <p className="sr-status">Clearing age {age}… q = {TABLE.q[Math.min(year, YEARS - 1)].toFixed(3)}</p>
      )}

      {/* ---------- Checkpoint ---------- */}
      {phase === "checkpoint" && current && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Checkpoint — age {TABLE.startAge + current.atYear}</p>
          <p className="mm-step-hint">{current.prompt}</p>
          <div className="mutiny-formula">{current.formula}</div>
          <p className="tri-note">{current.hint}</p>

          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              inputMode="decimal"
              value={input}
              disabled={checked}
              placeholder={current.decimals > 3 ? "e.g. 0.9605" : "e.g. 12345.67"}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") (checked ? continueRun() : checkAnswer()); }}
            />
            {!checked && <button type="button" className="calc-submit-btn" onClick={checkAnswer}>Check</button>}
          </div>

          {checked && (
            <>
              <p className={lastOk ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                {lastOk ? "Cleared it. " : "Tripped. "}
                {current.explain(
                  current.decimals > 3
                    ? current.answer.toFixed(current.decimals)
                    : current.answer.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                )}
              </p>
              <button type="button" className="continue-btn" onClick={continueRun}>
                {cpIndex + 1 >= CHECKPOINTS.length ? "Then the news breaks →" : "Keep running →"}
              </button>
            </>
          )}
        </div>
      )}

      {/* ---------- Longevity shock ---------- */}
      {phase === "shock" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">A new cardiac therapy is approved</p>
          <p className="mm-step-hint">
            Every q in the table falls by {Math.round((1 - IMPROVEMENT) * 100)}%. Survival to age 84
            rises from <strong>{(kSurvival(TABLE, YEARS) * 100).toFixed(1)}%</strong> to{" "}
            <strong>{(kSurvival(shockedTable, YEARS) * 100).toFixed(1)}%</strong>. You priced this
            book at <strong>${baseEPV.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>{" "}
            per policy. What is the shortfall per policy now?
          </p>
          <TeX block>{String.raw`\text{shortfall} = \ddot{a}_{improved} - \ddot{a}_{priced}`}</TeX>

          <div className="calc-input-row">
            <input
              type="text"
              className="calc-input"
              inputMode="decimal"
              value={shockInput}
              disabled={shockChecked}
              placeholder="Shortfall per policy, $"
              onChange={(e) => setShockInput(e.target.value)}
            />
            {!shockChecked && <button type="button" className="calc-submit-btn" onClick={checkShock}>Check</button>}
          </div>

          {shockChecked && (
            <>
              <p className={Math.abs(Number(shockInput) - shortfall) <= 900 ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                EPV rises from ${baseEPV.toLocaleString(undefined, { maximumFractionDigits: 0 })} to $
                {shockEPV.toLocaleString(undefined, { maximumFractionDigits: 0 })} — a shortfall of{" "}
                <strong>${shortfall.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>{" "}
                per policy, or{" "}
                <strong>${((shortfall * BOOK) / 1e6).toFixed(2)}M</strong> across a {BOOK.toLocaleString()}-policy
                book. Reserves were set on the old table and are now short by that amount.
              </p>
              <p className="quiz-q-explain">
                Note the asymmetry that defines the job: mortality improved by{" "}
                {Math.round((1 - IMPROVEMENT) * 100)}% but the liability moved only{" "}
                {((shockEPV / baseEPV - 1) * 100).toFixed(2)}%. Discounting mutes distant payments,
                so the damage concentrates in the years the cohort was always likely to reach. On a
                whole-life annuity, with no {YEARS}-year cutoff, the same improvement bites far
                harder — the payments it adds are exactly the ones you never reserved for.
              </p>
              <AccessStartButton
                gameId="actuarial-survival-run"
                title="Survival Run"
                defaultLabel="Run again"
                className="continue-btn"
                onStart={restart}
              >
                Price another cohort
              </AccessStartButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}
