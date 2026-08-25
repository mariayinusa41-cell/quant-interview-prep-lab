"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GameLeaderboard from "../../../../scores/GameLeaderboard";
import { generateDiceEVQuestions, type DiceEVQuestion, type DiceMechanic } from "./diceEVEngine";
import { DiceVisualizer } from "./DiceVisualizer";
import { AccessStartButton } from "../../../../access/TokenPlayButton";
// Reuses the drill lab's shell classes (menu/card/HUD/results/progress
// dots) the same way the Probability Ranking drill does.
import "../../../../drills/fermi/fermi.css";
import "./diceLab.css";

const MECHANIC_LABEL: Record<DiceMechanic, string> = {
  "optimal-reroll": "Optimal Reroll",
  "roll-until-target": "Roll Until Target",
  "max-min-order": "Max / Min of N",
  "bust-accumulator": "Bust Accumulator",
  "algebraic-combination": "Algebraic Combination",
  "conditional-wager": "Conditional Wager",
  "backgammon-flavor": "Backgammon Flavor",
};
const DIFFICULTIES = ["all", "1", "2", "3"] as const;
const DIFF_LABEL: Record<string, string> = { "1": "Warm-up", "2": "Interview", "3": "Hard" };
const ROUND_COUNT = 10;

// Short walk-through before the difficulty picker, same rhythm as Russian
// Roulette's tutorial: a couple of "Next" taps, then straight into setup.
// The mechanic mix itself is no longer a player-facing choice — every round
// draws from all 7 mechanics, same as Russian Roulette doesn't let you
// filter which wheel events show up.
// Short lines, not paragraphs: this reads on a pixel arcade screen, so it
// gets the same 1-3 line slide rhythm as the Blackjack and Russian Roulette
// tutorials rather than a block of prose in the body font.
const TUTORIAL_STEPS: string[][] = [
  [
    "Every round pulls from all seven dice mechanics.",
    "Rerolls, roll-until-target, max/min, bust runs, cube calls.",
    "You won't know which is next. Same as a real screen.",
  ],
  [
    "Each question shows the dice and a scenario.",
    "Work out the exact expected value and type it in.",
    "This isn't a guess. There's a precise answer.",
  ],
  [
    "Within 3% of exact: BULLSEYE, 3 pts.",
    "Within 10%: TIGHT, 2 pts.",
    "Inside the stated tolerance: 1 pt.",
  ],
];

type Phase = "tutorial" | "menu" | "playing" | "result";
type Answered = { q: DiceEVQuestion; guess: number; points: 0 | 1 | 2 | 3; label: string };

function scoreDiceEV(guess: number, q: DiceEVQuestion): { points: 0 | 1 | 2 | 3; label: string } {
  if (!Number.isFinite(guess)) return { points: 0, label: "No read" };
  const diff = Math.abs(guess - q.expectedValue);
  const diffPct = diff / Math.max(Math.abs(q.expectedValue), 1e-9);
  if (diffPct <= 0.03) return { points: 3, label: "Bullseye" };
  if (diffPct <= 0.1) return { points: 2, label: "Tight" };
  if (diff <= q.tolerance) return { points: 1, label: "Inside tolerance" };
  return { points: 0, label: "Missed the EV" };
}

function parseGuess(raw: string): number {
  const cleaned = raw.trim().replace(/[$,%]/g, "");
  return parseFloat(cleaned);
}

export default function DiceEVGame() {
  const [phase, setPhase] = useState<Phase>("tutorial");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [diffFilter, setDiffFilter] = useState<string>("all");

  const [deck, setDeck] = useState<DiceEVQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<Answered | null>(null);
  const [timer, setTimer] = useState(40);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const currentQRef = useRef<DiceEVQuestion | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dice-ev-best");
      if (stored) setBestScore(Number(stored));
    } catch { /* noop */ }
  }, []);

  const currentQ = deck[idx] ?? null;
  currentQRef.current = currentQ;
  const totalPossible = deck.length * 3;
  const currentScore = answered.reduce((s, a) => s + a.points, 0);

  useEffect(() => {
    if (phase !== "playing" || showResult || !currentQ) return;
    setTimer(currentQ.timeLimitSec);
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    timerRef.current = id;
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, showResult]);

  useEffect(() => {
    if (timer <= 0 && phase === "playing" && !showResult) submitCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  useEffect(() => {
    if (phase === "playing" && !showResult) setTimeout(() => inputRef.current?.focus(), 50);
  }, [phase, idx, showResult]);

  function submitCurrent() {
    const q = currentQRef.current;
    if (!q) return;
    const guess = parseGuess(input);
    const result = scoreDiceEV(guess, q);
    const a: Answered = { q, guess, ...result };
    setLastResult(a);
    setAnswered((prev) => [...prev, a]);
    setShowResult(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function startGame() {
    // Every round draws from all 7 mechanics — no player-facing filter for
    // that, same as Russian Roulette doesn't let you pick which wheel
    // events show up. Difficulty is the only knob left.
    let pool = generateDiceEVQuestions(60);
    let guard = 0;
    while (diffFilter !== "all" && pool.filter((q) => q.difficulty === Number(diffFilter)).length < ROUND_COUNT && guard < 40) {
      pool = pool.concat(generateDiceEVQuestions(20));
      guard++;
    }
    if (diffFilter !== "all") pool = pool.filter((q) => q.difficulty === Number(diffFilter));
    if (pool.length === 0) return;
    const d = pool.slice(0, ROUND_COUNT);
    setDeck(d);
    setIdx(0);
    setInput("");
    setAnswered([]);
    setShowResult(false);
    setLastResult(null);
    setPhase("playing");
  }

  function nextQuestion() {
    if (idx + 1 >= deck.length) {
      const final = answered.reduce((s, a) => s + a.points, 0);
      if (bestScore === null || final > bestScore) {
        setBestScore(final);
        try { localStorage.setItem("dice-ev-best", String(final)); } catch { /* noop */ }
      }
      setPhase("result");
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setShowResult(false);
    setLastResult(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (showResult) nextQuestion();
      else submitCurrent();
    }
  }

  // ---------- TUTORIAL ----------
  if (phase === "tutorial") {
    return (
      <div className="fermi-container dice-lab-container">
        <div className="fermi-menu">
          <h1 className="fermi-title">Dice EV Lab</h1>
          <p className="mm-teach-progress">
            {tutorialStep + 1} / {TUTORIAL_STEPS.length}
          </p>
          <div className="dice-lab-tutorial-step">
            {TUTORIAL_STEPS[tutorialStep].map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
            <button type="button" className="fermi-start-btn" onClick={() => setTutorialStep((s) => s + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="fermi-start-btn" onClick={() => setPhase("menu")}>
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- MENU (difficulty only, then straight into it) ----------
  if (phase === "menu") {
    return (
      <div className="fermi-container dice-lab-container">
        <div className="fermi-menu">
          <h1 className="fermi-title">Dice EV Lab</h1>

          <div className="fermi-filters">
            <div className="fermi-filter-group">
              <label className="fermi-filter-label">Difficulty</label>
              <div className="fermi-chips">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={diffFilter === d ? "fermi-chip active" : "fermi-chip"}
                    onClick={() => setDiffFilter(d)}
                  >
                    {d === "all" ? "All" : DIFF_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {bestScore !== null && (
            <p className="fermi-best">Personal best: {bestScore}/{totalPossible || ROUND_COUNT * 3} pts</p>
          )}

          <AccessStartButton
            // Must match the casino listing tile's auto-derived gameId
            // (`probability-casino-${title.toLowerCase().replaceAll(" ", "-")}`
            // from ../page.tsx) — otherwise the tile's access check and this
            // in-game one track two different session pools.
            gameId="probability-casino-dice-ev-lab"
            title="Dice EV Lab"
            defaultLabel={`Start (${ROUND_COUNT} questions)`}
            className="fermi-start-btn"
            onStart={startGame}
          >
            Start ({ROUND_COUNT} questions)
          </AccessStartButton>
        </div>
      </div>
    );
  }

  // ---------- RESULT ----------
  if (phase === "result") {
    const score = answered.reduce((s, a) => s + a.points, 0);
    const maxPts = deck.length * 3;
    const pct = maxPts > 0 ? Math.round((score / maxPts) * 100) : 0;
    return (
      <div className="fermi-container dice-lab-container">
        <div className="fermi-results">
          <h2 className="fermi-title">
            {pct >= 80 ? "Superb!" : pct >= 50 ? "Solid EV reads" : pct >= 25 ? "Keep practicing" : "Rough day"}
          </h2>
          <div className="fermi-final-score">
            <span className="fermi-score-big">{score}</span>
            <span className="fermi-score-of">/ {maxPts}</span>
          </div>
          <p className="fermi-pct">{pct}% accuracy</p>

          <GameLeaderboard gameId={"probability-casino-dice-ev-lab"} score={score} accuracy={pct} title="Dice EV Lab leaderboard" />

          <div className="fermi-review">
            {answered.map((a, i) => (
              <div key={a.q.id} className={`fermi-review-row ${a.points === 3 ? "bull" : a.points >= 1 ? "ok" : "miss"}`}>
                <div className="fermi-review-num">Q{i + 1}</div>
                <div className="fermi-review-body">
                  <p className="fermi-review-q">{a.q.title}</p>
                  <p className="fermi-review-vals">
                    You: <strong>{Number.isFinite(a.guess) ? a.guess : "—"}</strong> &nbsp;|&nbsp; EV:{" "}
                    <strong>{a.q.formattedEV}</strong>
                  </p>
                  <p className="fermi-review-explain">{a.q.derivation}</p>
                </div>
                <div className="fermi-review-pts">
                  <span className={`fermi-pts-badge pts-${a.points}`}>+{a.points}</span>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="fermi-start-btn" onClick={() => setPhase("menu")}>
            Play again
          </button>
        </div>
      </div>
    );
  }

  // ---------- PLAYING ----------
  return (
    <div className="fermi-container dice-lab-container">
      <div className="fermi-hud">
        <div className="fermi-hud-left">
          <span className="fermi-hud-q">Q{idx + 1}/{deck.length}</span>
          <span className="fermi-hud-cat">{currentQ ? MECHANIC_LABEL[currentQ.mechanic] : ""}</span>
        </div>
        <div className="fermi-hud-center">
          <span className={`fermi-timer ${timer <= 10 ? "danger" : timer <= 20 ? "warn" : ""}`}>{timer}s</span>
        </div>
        <div className="fermi-hud-right">
          <span className="fermi-hud-score">{currentScore} pts</span>
        </div>
      </div>

      <div className="fermi-card dice-lab-card">
        <h3 className="prob-title">{currentQ?.title}</h3>
        {currentQ && <DiceVisualizer values={currentQ.visualDice} sides={currentQ.diceSides} />}
        <p className="fermi-question">{currentQ?.question}</p>

        {!showResult ? (
          <div className="fermi-input-row">
            <input
              ref={inputRef}
              type="text"
              className="fermi-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentQ?.unit === "USD" ? "Exact EV (e.g. 4.25)" : "Your answer"}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button type="button" className="fermi-submit-btn" onClick={submitCurrent}>
              Lock in
            </button>
          </div>
        ) : lastResult ? (
          <div className="fermi-reveal">
            <div className={`fermi-verdict pts-${lastResult.points}`}>
              <span className="fermi-verdict-label">{lastResult.label}</span>
              <span className="fermi-verdict-pts">+{lastResult.points} pts</span>
            </div>
            <div className="fermi-comparison">
              <div className="fermi-comp-col">
                <span className="fermi-comp-label">Your answer</span>
                <span className="fermi-comp-val">{Number.isFinite(lastResult.guess) ? lastResult.guess : "—"}</span>
              </div>
              <div className="fermi-comp-arrow">→</div>
              <div className="fermi-comp-col">
                <span className="fermi-comp-label">Actual EV</span>
                <span className="fermi-comp-val">{lastResult.q.formattedEV}</span>
              </div>
            </div>
            <p className="fermi-explain">{lastResult.q.derivation}</p>
            <p className="fermi-explain dice-lab-shortcut">Shortcut: {lastResult.q.interviewShortcut}</p>
            <button type="button" className="fermi-next-btn" onClick={nextQuestion}>
              {idx + 1 >= deck.length ? "See results" : "Next question →"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="fermi-progress">
        {deck.map((_, i) => {
          const a = answered[i];
          let cls = "fermi-dot";
          if (i === idx && !showResult) cls += " current";
          else if (a) cls += ` pts-${a.points}`;
          else cls += " upcoming";
          return <div key={i} className={cls} />;
        })}
      </div>
    </div>
  );
}
