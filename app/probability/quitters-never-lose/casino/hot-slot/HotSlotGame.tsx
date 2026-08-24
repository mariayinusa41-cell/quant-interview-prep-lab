"use client";

import { useRef, useState } from "react";
import { buildSpots, computeOdds, spin, type Spot, type WheelOdds } from "./hotSlotMath";
import { pickHotSlotQuestion, type HotSlotQuestionInstance } from "./hotSlotQuestions";
import { PIXEL_COLORS, ResultBanner } from "../../lottery/pick/PixelArt";
import { RouletteIcon } from "../../PixelIcons";

const STARTING_BANKROLL = 100;
const WHEEL_SIZES = [5, 6, 8, 10, 20];
const WAGER_OPTIONS = [5, 10, 20, 50];
const STEP_DELAY = 1100;

const TUTORIAL_STEPS = [
  "Pick a number on the wheel. Before every spin, you'll answer a probability question about your current odds.",
  "Land on one of your marked numbers and you're out. Land on anything else and that number is removed from the wheel for good — the pool shrinks and your payout multiplier grows.",
  "Get a question wrong and you have to mark an ADDITIONAL number before you're allowed to spin. A wrong answer makes your actual odds worse, not just your score.",
  "You can cash out any time after your first safe spin — or keep pushing your luck on a shrinking wheel.",
];

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtX(n: number) {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}x`;
}

function parseAnswer(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes("/")) {
    const [a, b] = trimmed.split("/").map((s) => Number(s.trim()));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
    return a / b;
  }
  const n = Number(trimmed.replace(/x$/i, ""));
  return Number.isFinite(n) ? n : null;
}

type Phase = "tutorial" | "setup" | "picking" | "question" | "spinning" | "resolved";

export default function HotSlotGame() {
  const [tutorialStep, setTutorialStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("tutorial");

  const [bankroll, setBankroll] = useState(STARTING_BANKROLL);
  const [wheelSize, setWheelSize] = useState(6);
  const [wager, setWager] = useState<number | null>(null);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [markedIds, setMarkedIds] = useState<number[]>([]);
  const [pullCount, setPullCount] = useState(0);
  const [cumulativeMultiplier, setCumulativeMultiplier] = useState(1);

  const [question, setQuestion] = useState<HotSlotQuestionInstance | null>(null);
  const [odds, setOdds] = useState<WheelOdds | null>(null);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [extraPickNeeded, setExtraPickNeeded] = useState(false);

  const [rotation, setRotation] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [outcome, setOutcome] = useState<"cashed" | "out" | null>(null);
  const pendingDraw = useRef<Spot | null>(null);

  const startGame = () => {
    if (wager === null || wager > bankroll) return;
    setSpots(buildSpots(wheelSize));
    setBankroll((b) => b - wager);
    setMarkedIds([]);
    setPullCount(0);
    setCumulativeMultiplier(1);
    setStatusMsg("");
    setOutcome(null);
    setPhase("picking");
  };

  const askQuestion = (currentSpots: Spot[], currentMarked: number[]) => {
    const o = computeOdds(currentSpots, currentMarked);
    setOdds(o);
    setQuestion(pickHotSlotQuestion());
    setAnswer("");
    setChecked(false);
    setExtraPickNeeded(false);
  };

  const pickSpot = (id: number) => {
    const marked = [id];
    setMarkedIds(marked);
    askQuestion(spots, marked);
    setPhase("question");
  };

  const checkQuestion = () => {
    setChecked(true);
    if (!question || !odds) return;
    const check = question.answer(odds);
    const correct = question.choices ? answer === check.display : (() => {
      const p = parseAnswer(answer);
      return p !== null && Math.abs(p - check.decimal) <= check.tolerance;
    })();
    if (!correct) {
      const unmarkedActive = spots.filter((s) => s.active && !markedIds.includes(s.id));
      setExtraPickNeeded(unmarkedActive.length > 0);
    }
  };

  const markExtra = (id: number) => {
    const nextMarkedIds = [...markedIds, id];
    setMarkedIds(nextMarkedIds);
    setOdds(computeOdds(spots, nextMarkedIds));
    setExtraPickNeeded(false);
  };

  const spinNow = () => {
    const drawn = spin(spots);
    const drawnIndex = activeSpots.findIndex((spot) => spot.id === drawn.id);
    const sliceAngle = 360 / activeSpots.length;
    const targetAngle = 270 - (drawnIndex + 0.5) * sliceAngle;
    const currentAngle = ((rotation % 360) + 360) % 360;
    const adjustment = (targetAngle - currentAngle + 360) % 360;

    pendingDraw.current = drawn;
    setPhase("spinning");
    setStatusMsg("");
    setRotation(rotation + 360 * 4 + adjustment);
    window.setTimeout(resolveSpin, 2300);
  };

  const resolveSpin = () => {
    const drawn = pendingDraw.current;
    pendingDraw.current = null;
    if (!drawn) return;

    if (markedIds.includes(drawn.id)) {
      setStatusMsg("Landed on one of your marked numbers. You're out.");
      window.setTimeout(() => {
        setOutcome("out");
        setPhase("resolved");
      }, STEP_DELAY);
      return;
    }

    setStatusMsg(`Safe! ${fmtX(odds!.offeredMultiplier)} locked in.`);
    setCumulativeMultiplier((m) => m * odds!.offeredMultiplier);
    setPullCount((c) => c + 1);
    const nextSpots = spots.map((s) => (s.id === drawn.id ? { ...s, active: false } : s));
    setSpots(nextSpots);
    window.setTimeout(() => {
      setStatusMsg("");
      askQuestion(nextSpots, markedIds);
      setPhase("question");
    }, STEP_DELAY);
  };

  const cashOut = () => {
    if (!wager) return;
    const won = wager * cumulativeMultiplier;
    setBankroll((b) => b + won);
    setOutcome("cashed");
    setPhase("resolved");
  };

  const playAgain = () => {
    setPhase("setup");
    setWager(null);
  };

  const answerCheck = question && odds ? question.answer(odds) : null;
  const isCorrect =
    checked && !!answerCheck && (question!.choices ? answer === answerCheck.display : (() => {
      const p = parseAnswer(answer);
      return p !== null && Math.abs(p - answerCheck.decimal) <= answerCheck.tolerance;
    })());

  const activeSpots = spots.filter((s) => s.active);
  const unmarkedActiveForExtraPick = spots.filter((s) => s.active && !markedIds.includes(s.id));
  const showWheel = spots.length > 0 && (phase === "picking" || phase === "question" || phase === "spinning");

  if (phase === "tutorial") {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Quitters Never Lose</p>
        <div className="hs-slot-logo" aria-hidden="true"><RouletteIcon className="hs-slot-logo-icon" /></div>
        <h1 className="pirate-story-line answer-title">Russian Roulette</h1>
        <div className="pixel-stage">
          <div className="hs-tutorial-step">
            <p>{TUTORIAL_STEPS[tutorialStep]}</p>
          </div>
          <div style={{ marginTop: 18 }}>
            {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
              <button type="button" className="hs-chunky-btn" onClick={() => setTutorialStep((s) => s + 1)}>
                Next
              </button>
            ) : (
              <button type="button" className="hs-chunky-btn" onClick={() => setPhase("setup")}>
                Start game
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Quitters Never Lose</p>
      <div className="hs-slot-logo" aria-hidden="true"><RouletteIcon className="hs-slot-logo-icon" /></div>
      <h1 className="pirate-story-line answer-title">Russian Roulette</h1>

      {phase === "setup" && (
        <div className="pixel-stage">
          <p className="quiz-panel-title" style={{ marginBottom: 12 }}>
            Bankroll: {fmt(bankroll)}
          </p>
          <p className="pick-ticket-col-label" style={{ marginBottom: 6 }}>
            WHEEL SIZE
          </p>
          <div className="answer-crew-picker" style={{ marginBottom: 18 }}>
            {WHEEL_SIZES.map((s) => (
              <button key={s} type="button" className={wheelSize === s ? "chip-btn active" : "chip-btn"} onClick={() => setWheelSize(s)}>
                {s} numbers
              </button>
            ))}
          </div>
          <p className="pick-ticket-col-label" style={{ marginBottom: 6 }}>
            WAGER
          </p>
          <div className="answer-crew-picker" style={{ marginBottom: 18 }}>
            {WAGER_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                className={wager === w ? "chip-btn active" : "chip-btn"}
                disabled={w > bankroll}
                onClick={() => setWager(w)}
              >
                {fmt(w)}
              </button>
            ))}
          </div>
          <button type="button" className="continue-btn" disabled={wager === null} onClick={startGame}>
            Lock in
          </button>
        </div>
      )}

      {showWheel && (
        <div className="pixel-stage">
          <div className="answer-crew-picker" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <span className="qty-hint">Spin {pullCount + 1}</span>
            <span className="qty-hint">Payout: {pullCount === 0 ? "1.00x" : fmtX(cumulativeMultiplier)}</span>
          </div>

          <div className="hs-wheel-wrap">
            <div className="hs-wheel-pointer" />
            <svg viewBox="0 0 200 200" className="hs-wheel-svg" style={{ transform: `rotate(${rotation}deg)` }} shapeRendering="crispEdges">
              <circle cx={100} cy={100} r={95} fill={PIXEL_COLORS.bg} stroke={PIXEL_COLORS.border} strokeWidth={4} />
              {activeSpots.map((s, i) => {
                const sliceAngle = 360 / activeSpots.length;
                const startAngle = i * sliceAngle;
                const endAngle = startAngle + sliceAngle;
                const isMarked = markedIds.includes(s.id);
                const startRad = (Math.PI * startAngle) / 180;
                const endRad = (Math.PI * endAngle) / 180;
                const x1 = 100 + 95 * Math.cos(startRad);
                const y1 = 100 + 95 * Math.sin(startRad);
                const x2 = 100 + 95 * Math.cos(endRad);
                const y2 = 100 + 95 * Math.sin(endRad);
                const largeArc = sliceAngle > 180 ? 1 : 0;
                const midRad = startRad + (endRad - startRad) / 2;
                return (
                  <g key={s.id}>
                    <path
                      d={`M100,100 L${x1},${y1} A95,95 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={isMarked ? PIXEL_COLORS.bad : PIXEL_COLORS.border}
                      stroke={isMarked ? PIXEL_COLORS.accent : PIXEL_COLORS.white}
                      strokeWidth={isMarked ? 4 : 1}
                    />
                    <text
                      x={100 + 62 * Math.cos(midRad)}
                      y={100 + 62 * Math.sin(midRad)}
                      fill={PIXEL_COLORS.white}
                      fontSize={14}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ fontFamily: "var(--font-pixel)" }}
                    >
                      {s.id}
                    </text>
                  </g>
                );
              })}
              <circle cx={100} cy={100} r={22} fill={PIXEL_COLORS.border} stroke={PIXEL_COLORS.accent} strokeWidth={4} />
            </svg>
          </div>

          <p className="hs-status-msg">{statusMsg}</p>

          {phase === "picking" && (
            <>
              <p className="quiz-panel-title" style={{ marginBottom: 8 }}>
                Pick a number
              </p>
              <div className="hs-spot-grid">
                {spots.map((s) => (
                  <button key={s.id} type="button" className="hs-spot-btn" onClick={() => pickSpot(s.id)}>
                    {s.id}
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === "question" && question && odds && (
            <div className="quiz-panel" style={{ marginTop: 6 }}>
              <p className="quiz-panel-title">Before you spin...</p>
              <div className={checked ? (isCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                <p className="quiz-q-topic">{question.topicLabel}</p>
                <p className="quiz-q-prompt">{question.prompt(odds)}</p>

                {question.choices ? (
                  <div className="answer-crew-picker">
                    {question.choices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={answer === c ? "chip-btn active" : "chip-btn"}
                        disabled={checked}
                        onClick={() => setAnswer(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="quiz-q-input-row">
                    <input
                      type="text"
                      className="quiz-q-input"
                      placeholder="type your answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      disabled={checked}
                    />
                  </div>
                )}

                {!checked && (
                  <button type="button" className="chip-btn" disabled={!answer} onClick={checkQuestion} style={{ marginTop: 10 }}>
                    Check
                  </button>
                )}

                {checked && (
                  <p className={isCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                    {isCorrect ? "✓ Correct. " : `✗ Not quite — it's ${answerCheck!.display}. `}
                    {question.explanation(odds)}
                  </p>
                )}
              </div>

              {checked && extraPickNeeded && (
                <div style={{ marginTop: 12 }}>
                  <p className="qty-hint">Wrong answer — mark one additional number before you can spin:</p>
                  <div className="hs-spot-grid">
                    {unmarkedActiveForExtraPick.map((s) => (
                      <button key={s.id} type="button" className="hs-spot-btn" onClick={() => markExtra(s.id)}>
                        {s.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {checked && !extraPickNeeded && (
                <div className="answer-crew-picker" style={{ marginTop: 10 }}>
                  <button type="button" className="continue-btn" onClick={spinNow}>
                    Spin
                  </button>
                  {pullCount > 0 && (
                    <button type="button" className="chip-btn" onClick={cashOut}>
                      Cash out — {fmt((wager ?? 0) * cumulativeMultiplier)}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {phase === "resolved" && (
        <div className="pixel-stage">
          <ResultBanner
            outcome={outcome === "cashed" ? "win" : "loss"}
            title={outcome === "cashed" ? "CASHED OUT" : "YOU'RE OUT"}
            sub={
              outcome === "cashed"
                ? `${fmt((wager ?? 0) * cumulativeMultiplier)} secured after ${pullCount} safe spin${pullCount === 1 ? "" : "s"}`
                : `Lost your ${fmt(wager ?? 0)} wager`
            }
          />
          <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={playAgain}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
