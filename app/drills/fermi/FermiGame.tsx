"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fermiQuestions, type FermiQuestion } from "./fermiQuestions";
import { getProceduralFermiQuestions } from "./proceduralFermi";
import { curatedTechnicalQuestions, scoreTechnical, type TechnicalQuestion } from "./technicalQuestions";
import { getProceduralTechnicalQuestions } from "./proceduralTechnical";
import { CategoryIcon, ResultIcon, StarIcon, TargetIcon } from "./FermiIcons";
import { AccessStartButton } from "../../access/TokenPlayButton";
import "./fermi.css";

// ---------- Scoring logic ----------
// Fermi estimation is really a question about a RANGE, not a single number —
// an interviewer wants a bound you'd actually defend, and "somewhere between
// 10k and 100k" is a real answer where a bare "40,000" hides whether you had
// any idea. So the player gives a low and a high bound, and scoring rewards
// two things that pull against each other:
//
//   1. the interval has to actually contain the truth, and
//   2. the tighter it is, the more it's worth.
//
// Without (2) you'd just answer 1 to 10^12 every time and always "win";
// without (1) you'd guess narrow and never be held to it. Width is measured
// in orders of magnitude (log10 high − log10 low), which is the natural
// scale for a quantity that could be thousands or billions.
function scoreInterval(low: number, high: number, truth: number): {
  points: number;
  label: string;
  contains: boolean;
  widthOom: number;
} {
  if (!(low > 0) || !(high > 0) || !(truth > 0) || high < low) {
    return { points: 0, label: "Invalid range", contains: false, widthOom: Infinity };
  }
  const widthOom = Math.log10(high) - Math.log10(low);
  const contains = truth >= low && truth <= high;

  if (!contains) {
    // A miss still distinguishes "just outside" from "wildly off", but
    // neither earns points — the bound was wrong either way.
    const missOom = truth < low ? Math.log10(low) - Math.log10(truth) : Math.log10(truth) - Math.log10(high);
    return {
      points: 0,
      label: missOom <= 0.5 ? "Just missed the range" : "Truth was outside your range",
      contains: false,
      widthOom,
    };
  }

  if (widthOom <= 0.5) return { points: 4, label: "Tight and correct!", contains, widthOom };
  if (widthOom <= 1) return { points: 3, label: "Good range", contains, widthOom };
  if (widthOom <= 2) return { points: 2, label: "Contained, but wide", contains, widthOom };
  return { points: 1, label: "Correct, but too wide to be useful", contains, widthOom };
}

function formatNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (n < 0.01) return n.toExponential(1);
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CATEGORIES = [
  "all",
  "everyday",
  "physics",
  "geography",
  "economics",
  "biology",
  "engineering",
  "tech",
  "pop-culture",
] as const;
const CAT_LABEL: Record<string, string> = { "pop-culture": "Pop Culture" };
const DIFFICULTIES = ["all", "1", "2", "3"] as const;
const DIFF_LABEL: Record<string, string> = { "1": "Warm-up", "2": "Interview", "3": "Hard" };
const ROUND_COUNT = 10;
const TIME_LIMIT_S = 60; // seconds per question (classic mode; technical mode uses per-question timeLimitSec)
const PROCEDURAL_BATCH_SIZE = 30; // freshly generated each visit to the menu, on top of the hand-written set

// Technical estimation — the assessment-style sibling of classic Fermi.
// Tight numeric answers (a dice board you 40-second-count, a plotted path
// you sum mentally, a rule-of-thumb calc under a clock) instead of
// open-domain magnitude guessing, so it gets its own category list, its own
// percentage/CI scoring (see scoreTechnical), and its own visuals below.
const TECH_CATEGORIES = [
  "all",
  "visual-counting",
  "grid-path",
  "combinatorics-math",
  "random-walk-probability",
  "market-microstructure",
  "hardware-latency",
] as const;
const TECH_CAT_LABEL: Record<string, string> = {
  "visual-counting": "Visual Counting",
  "grid-path": "Grid Path",
  "combinatorics-math": "Combinatorics",
  "random-walk-probability": "Random Walk",
  "market-microstructure": "Market Microstructure",
  "hardware-latency": "Hardware Latency",
};
const TECH_ROUND_COUNT = 8;

type Phase = "menu" | "playing" | "result";
type Mode = "classic" | "technical";
type Answered = { q: FermiQuestion; low: number; high: number; points: number; label: string; contains: boolean; widthOom: number };
type TechAnswered = { q: TechnicalQuestion; guess: number; points: 0 | 1 | 2 | 3; label: string };

const PIP_LAYOUT: Record<number, boolean[]> = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
};

function DieFace({ value }: { value: number }) {
  const cells = PIP_LAYOUT[value] ?? PIP_LAYOUT[1];
  return (
    <div className="tech-die">
      {cells.map((on, i) => (
        <span key={i} className={on ? "tech-die-pip on" : "tech-die-pip"} />
      ))}
    </div>
  );
}

function PathDiagram({ points }: { points: { x: number; y: number; label: string }[] }) {
  if (points.length === 0) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const pad = 3;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  // Flip Y for screen coordinates (grid convention: up is positive).
  const toScreen = (p: { x: number; y: number }) => ({ sx: p.x - minX, sy: h - (p.y - minY) });
  const poly = points.map(toScreen);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="tech-path-svg" preserveAspectRatio="xMidYMid meet">
      <polyline
        points={poly.map((p) => `${p.sx},${p.sy}`).join(" ")}
        fill="none"
        stroke="var(--tech-path-line, #47f0c2)"
        strokeWidth={h * 0.015 + 0.15}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {poly.map((p, i) => (
        <g key={i}>
          <circle cx={p.sx} cy={p.sy} r={h * 0.025 + 0.2} className="tech-path-node" />
          <text x={p.sx} y={p.sy - h * 0.04} className="tech-path-label">
            {points[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function FermiGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [mode, setMode] = useState<Mode>("classic");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [diffFilter, setDiffFilter] = useState<string>("all");
  const [techCatFilter, setTechCatFilter] = useState<string>("all");
  const [techDiffFilter, setTechDiffFilter] = useState<string>("all");

  // A fresh batch of procedurally generated questions, layered on top of the
  // hand-written set below. Regenerated each time the menu is shown so
  // replaying doesn't feel like the same fixed pool every time.
  const [proceduralPool, setProceduralPool] = useState<FermiQuestion[]>(() =>
    getProceduralFermiQuestions(PROCEDURAL_BATCH_SIZE)
  );
  // Same idea for the technical pool — dice boards and grid paths inside it
  // are freshly rolled every time this regenerates, so the "picture" is
  // never the same board twice.
  const [technicalPool, setTechnicalPool] = useState<TechnicalQuestion[]>(() =>
    getProceduralTechnicalQuestions()
  );

  const [deck, setDeck] = useState<FermiQuestion[]>([]);
  const [techDeck, setTechDeck] = useState<TechnicalQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [lowInput, setLowInput] = useState("");
  const [highInput, setHighInput] = useState("");
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [techAnswered, setTechAnswered] = useState<TechAnswered[]>([]);
  const [showResult, setShowResult] = useState(false); // per-question reveal
  const [lastResult, setLastResult] = useState<Answered | null>(null);
  const [lastTechResult, setLastTechResult] = useState<TechAnswered | null>(null);
  const [timer, setTimer] = useState(TIME_LIMIT_S);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [bestTechScore, setBestTechScore] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Load best scores from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fermi-best");
      if (stored) setBestScore(Number(stored));
      const storedTech = localStorage.getItem("fermi-tech-best");
      if (storedTech) setBestTechScore(Number(storedTech));
    } catch { /* noop */ }
  }, []);

  // Reshuffle in a fresh procedural batch whenever the player lands back on
  // the menu (covers both "Play again" and returning after a completed run).
  useEffect(() => {
    if (phase === "menu") {
      setProceduralPool(getProceduralFermiQuestions(PROCEDURAL_BATCH_SIZE));
      setTechnicalPool(getProceduralTechnicalQuestions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const allQuestions = useMemo(() => [...fermiQuestions, ...proceduralPool], [proceduralPool]);
  const allTechnical = useMemo(
    () => [...curatedTechnicalQuestions, ...technicalPool],
    [technicalPool]
  );

  const currentQ = deck[idx] ?? null;
  const currentTechQ = techDeck[idx] ?? null;
  const totalPossible = deck.length * 3;
  const totalTechPossible = techDeck.length * 3;
  const currentScore = answered.reduce((s, a) => s + a.points, 0);
  const currentTechScore = techAnswered.reduce((s, a) => s + a.points, 0);

  // Timer countdown — classic mode uses a fixed 60s; technical mode uses the
  // question's own timeLimitSec (a 40-second dice count is a different drill
  // than a 25-second CPU-cycle calc).
  useEffect(() => {
    if (phase !== "playing" || showResult) return;
    const limit = mode === "technical" ? currentTechQ?.timeLimitSec ?? 40 : TIME_LIMIT_S;
    setTimer(limit);
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    timerRef.current = id;
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, showResult, mode]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (timer <= 0 && phase === "playing" && !showResult) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  function startGame() {
    if (mode === "technical") {
      let pool = allTechnical;
      if (techCatFilter !== "all") pool = pool.filter((q) => q.category === techCatFilter);
      if (techDiffFilter !== "all") pool = pool.filter((q) => q.difficulty === Number(techDiffFilter));
      if (pool.length === 0) return;
      const d = shuffle(pool).slice(0, TECH_ROUND_COUNT);
      setTechDeck(d);
    } else {
      let pool = allQuestions;
      if (catFilter !== "all") pool = pool.filter((q) => q.category === catFilter);
      if (diffFilter !== "all") pool = pool.filter((q) => q.difficulty === Number(diffFilter));
      if (pool.length === 0) return;
      const d = shuffle(pool).slice(0, ROUND_COUNT);
      setDeck(d);
    }
    setIdx(0);
    setInput("");
    setLowInput("");
    setHighInput("");
    setAnswered([]);
    setTechAnswered([]);
    setShowResult(false);
    setLastResult(null);
    setLastTechResult(null);
    setPhase("playing");
  }

  function handleSubmit() {
    const raw = input.trim().replace(/,/g, "");
    let guess = parseGuessInput(raw);

    if (mode === "technical") {
      if (!currentTechQ) return;
      const result = scoreTechnical(guess, currentTechQ);
      const a: TechAnswered = { q: currentTechQ, guess, ...result };
      setLastTechResult(a);
      setTechAnswered((prev) => [...prev, a]);
    } else {
      if (!currentQ) return;
      let low = parseGuessInput(lowInput.trim().replace(/,/g, ""));
      let high = parseGuessInput(highInput.trim().replace(/,/g, ""));
      // An unparseable or missing bound is scored as a miss rather than
      // silently coerced into something that might accidentally contain the
      // answer.
      if (isNaN(low) || low <= 0) low = NaN;
      if (isNaN(high) || high <= 0) high = NaN;
      const result = scoreInterval(low, high, currentQ.answer);
      const a: Answered = { q: currentQ, low, high, ...result };
      setLastResult(a);
      setAnswered((prev) => [...prev, a]);
    }
    setShowResult(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function nextQuestion() {
    const deckLen = mode === "technical" ? techDeck.length : deck.length;
    if (idx + 1 >= deckLen) {
      // Game over
      if (mode === "technical") {
        const final = techAnswered.reduce((s, a) => s + a.points, 0);
        if (bestTechScore === null || final > bestTechScore) {
          setBestTechScore(final);
          try { localStorage.setItem("fermi-tech-best", String(final)); } catch { /* noop */ }
        }
      } else {
        const final = answered.reduce((s, a) => s + a.points, 0);
        if (bestScore === null || final > bestScore) {
          setBestScore(final);
          try { localStorage.setItem("fermi-best", String(final)); } catch { /* noop */ }
        }
      }
      setPhase("result");
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setLowInput("");
    setHighInput("");
    setShowResult(false);
    setLastResult(null);
    setLastTechResult(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (showResult) nextQuestion();
      else handleSubmit();
    }
  }

  // Focus input when playing
  useEffect(() => {
    if (phase === "playing" && !showResult) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase, idx, showResult]);

  const availableCount = useMemo(() => {
    let pool = allQuestions;
    if (catFilter !== "all") pool = pool.filter((q) => q.category === catFilter);
    if (diffFilter !== "all") pool = pool.filter((q) => q.difficulty === Number(diffFilter));
    return pool.length;
  }, [allQuestions, catFilter, diffFilter]);

  const availableTechCount = useMemo(() => {
    let pool = allTechnical;
    if (techCatFilter !== "all") pool = pool.filter((q) => q.category === techCatFilter);
    if (techDiffFilter !== "all") pool = pool.filter((q) => q.difficulty === Number(techDiffFilter));
    return pool.length;
  }, [allTechnical, techCatFilter, techDiffFilter]);

  // ---------- MENU ----------
  if (phase === "menu") {
    return (
      <div className="fermi-container">
        <div className="fermi-menu">
          <div className="fermi-logo">
            <TargetIcon className="fermi-logo-icon" />
          </div>
          <h1 className="fermi-title">{mode === "technical" ? "Technical Estimation" : "Fermi Estimation"}</h1>
          <p className="fermi-subtitle">
            {mode === "technical"
              ? "The screen-style drill: count a dice board in 40 seconds, sum a plotted path, or apply a rule of thumb under a clock. Tight numeric answers, not magnitude guessing."
              : "How close can you get? Estimate real-world quantities to the right order of magnitude — a core quant interview skill."}
          </p>

          <div className="fermi-mode-toggle">
            <button
              type="button"
              className={mode === "classic" ? "fermi-mode-btn active" : "fermi-mode-btn"}
              onClick={() => setMode("classic")}
            >
              Classic Fermi
            </button>
            <button
              type="button"
              className={mode === "technical" ? "fermi-mode-btn active" : "fermi-mode-btn"}
              onClick={() => setMode("technical")}
            >
              Technical (Assessment-Style)
            </button>
          </div>

          {mode === "classic" ? (
            <>
              <div className="fermi-filters">
                <div className="fermi-filter-group">
                  <label className="fermi-filter-label">Category</label>
                  <div className="fermi-chips">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={catFilter === c ? "fermi-chip active" : "fermi-chip"}
                        onClick={() => setCatFilter(c)}
                      >
                        {c !== "all" && <CategoryIcon category={c} className="fermi-chip-icon" />}
                        {c === "all" ? "All" : CAT_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
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

              <p className="fermi-pool-count">{availableCount} question{availableCount !== 1 ? "s" : ""} available</p>
              {bestScore !== null && (
                <p className="fermi-best">Personal best: {bestScore}/{totalPossible || ROUND_COUNT * 3} pts</p>
              )}

              <AccessStartButton
                gameId="drills-fermi-estimation"
                title="Fermi Estimation"
                defaultLabel={availableCount === 0 ? "No questions match" : `Start (${Math.min(ROUND_COUNT, availableCount)} questions)`}
                className="fermi-start-btn"
                onStart={startGame}
              >
                {availableCount === 0 ? "No questions match" : `Start (${Math.min(ROUND_COUNT, availableCount)} questions)`}
              </AccessStartButton>
            </>
          ) : (
            <>
              <div className="fermi-filters">
                <div className="fermi-filter-group">
                  <label className="fermi-filter-label">Category</label>
                  <div className="fermi-chips">
                    {TECH_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={techCatFilter === c ? "fermi-chip active" : "fermi-chip"}
                        onClick={() => setTechCatFilter(c)}
                      >
                        {c === "all" ? "All" : TECH_CAT_LABEL[c] ?? c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="fermi-filter-group">
                  <label className="fermi-filter-label">Difficulty</label>
                  <div className="fermi-chips">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={techDiffFilter === d ? "fermi-chip active" : "fermi-chip"}
                        onClick={() => setTechDiffFilter(d)}
                      >
                        {d === "all" ? "All" : DIFF_LABEL[d]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="fermi-pool-count">
                {availableTechCount} question{availableTechCount !== 1 ? "s" : ""} available
              </p>
              {bestTechScore !== null && (
                <p className="fermi-best">
                  Personal best: {bestTechScore}/{totalTechPossible || TECH_ROUND_COUNT * 3} pts
                </p>
              )}

              <AccessStartButton
                gameId="drills-fermi-estimation"
                title="Technical Estimation"
                defaultLabel={
                  availableTechCount === 0
                    ? "No questions match"
                    : `Start (${Math.min(TECH_ROUND_COUNT, availableTechCount)} questions)`
                }
                className="fermi-start-btn"
                onStart={startGame}
              >
                {availableTechCount === 0
                  ? "No questions match"
                  : `Start (${Math.min(TECH_ROUND_COUNT, availableTechCount)} questions)`}
              </AccessStartButton>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- RESULT ----------
  if (phase === "result") {
    const isTech = mode === "technical";
    // `given` is a pre-formatted string rather than a number: technical mode
    // still answers with a single estimate, everyday mode now answers with a
    // low–high range, and the review row just needs to print whichever it was.
    const list: { id: string | number; question: string; given: string; answer: number; unit: string; explanation: string; points: number }[] =
      isTech
        ? techAnswered.map((a) => ({ ...a.q, given: formatNumber(a.guess), points: a.points }))
        : answered.map((a) => ({
            ...a.q,
            given:
              Number.isNaN(a.low) || Number.isNaN(a.high)
                ? "—"
                : `${formatNumber(a.low)} to ${formatNumber(a.high)}`,
            points: a.points,
          }));
    const score = list.reduce((s, a) => s + a.points, 0);
    // Interval scoring tops out at 4; the technical mode's scoreTechnical
    // still tops out at 3, so the denominator has to follow the mode.
    const maxPts = list.length * (isTech ? 3 : 4);
    const pct = maxPts > 0 ? Math.round((score / maxPts) * 100) : 0;
    return (
      <div className="fermi-container">
        <div className="fermi-results">
          <div className="fermi-logo">
            <ResultIcon pct={pct} className="fermi-logo-icon" />
          </div>
          <h2 className="fermi-title">
            {pct >= 80 ? "Superb!" : pct >= 50 ? "Solid estimation" : pct >= 25 ? "Keep practicing" : "Rough day"}
          </h2>
          <div className="fermi-final-score">
            <span className="fermi-score-big">{score}</span>
            <span className="fermi-score-of">/ {maxPts}</span>
          </div>
          <p className="fermi-pct">{pct}% accuracy</p>

          <div className="fermi-review">
            {list.map((a, i) => (
              <div key={a.id} className={`fermi-review-row ${a.points >= (isTech ? 3 : 4) ? "bull" : a.points >= 1 ? "ok" : "miss"}`}>
                <div className="fermi-review-num">Q{i + 1}</div>
                <div className="fermi-review-body">
                  <p className="fermi-review-q">{a.question}</p>
                  <p className="fermi-review-vals">
                    You: <strong>{a.given}</strong> &nbsp;|&nbsp; Answer:{" "}
                    <strong>{formatNumber(a.answer)}</strong> {a.unit}
                  </p>
                  <p className="fermi-review-explain">{a.explanation}</p>
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

  // ---------- PLAYING (technical) ----------
  if (mode === "technical") {
    return (
      <div className="fermi-container">
        <div className="fermi-hud">
          <div className="fermi-hud-left">
            <span className="fermi-hud-q">Q{idx + 1}/{techDeck.length}</span>
            <span className="fermi-hud-cat">
              {currentTechQ ? TECH_CAT_LABEL[currentTechQ.category] ?? currentTechQ.category : ""}
            </span>
          </div>
          <div className="fermi-hud-center">
            <span className={`fermi-timer ${timer <= 10 ? "danger" : timer <= 20 ? "warn" : ""}`}>{timer}s</span>
          </div>
          <div className="fermi-hud-right">
            <span className="fermi-hud-score">{currentTechScore} pts</span>
            <span className="fermi-hud-diff">
              {[1, 2, 3].map((n) => (
                <StarIcon key={n} filled={n <= (currentTechQ?.difficulty ?? 1)} className="fermi-star-icon" />
              ))}
            </span>
          </div>
        </div>

        <div className="fermi-card">
          {currentTechQ?.metadata?.diceFaces && (
            <div className="tech-dice-grid">
              {currentTechQ.metadata.diceFaces.map((f, i) => (
                <DieFace key={i} value={f} />
              ))}
            </div>
          )}
          {currentTechQ?.metadata?.pathCoordinates && (
            <PathDiagram points={currentTechQ.metadata.pathCoordinates} />
          )}

          <p className="fermi-question">{currentTechQ?.question}</p>

          {!showResult ? (
            <div className="fermi-input-row">
              <input
                ref={inputRef}
                type="text"
                className="fermi-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Your estimate${currentTechQ ? ` (${currentTechQ.unit})` : ""}`}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button type="button" className="fermi-submit-btn" onClick={handleSubmit}>
                Lock in
              </button>
            </div>
          ) : lastTechResult ? (
            <div className="fermi-reveal">
              <div className={`fermi-verdict pts-${lastTechResult.points}`}>
                <span className="fermi-verdict-label">{lastTechResult.label}</span>
                <span className="fermi-verdict-pts">+{lastTechResult.points} pts</span>
              </div>
              <div className="fermi-comparison">
                <div className="fermi-comp-col">
                  <span className="fermi-comp-label">Your guess</span>
                  <span className="fermi-comp-val">
                    {Number.isFinite(lastTechResult.guess) ? formatNumber(lastTechResult.guess) : "—"}
                  </span>
                </div>
                <div className="fermi-comp-arrow">→</div>
                <div className="fermi-comp-col">
                  <span className="fermi-comp-label">Actual</span>
                  <span className="fermi-comp-val">
                    {formatNumber(lastTechResult.q.answer)} {lastTechResult.q.unit}
                  </span>
                </div>
              </div>
              <div className="fermi-oom-bar">
                <RangeBar
                  guess={lastTechResult.guess}
                  answer={lastTechResult.q.answer}
                  low={lastTechResult.q.lowBound}
                  high={lastTechResult.q.highBound}
                />
              </div>
              <p className="fermi-explain">{lastTechResult.q.explanation}</p>
              <button type="button" className="fermi-next-btn" onClick={nextQuestion}>
                {idx + 1 >= techDeck.length ? "See results" : "Next question →"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="fermi-progress">
          {techDeck.map((_, i) => {
            const a = techAnswered[i];
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

  // ---------- PLAYING ----------
  return (
    <div className="fermi-container">
      <div className="fermi-hud">
        <div className="fermi-hud-left">
          <span className="fermi-hud-q">Q{idx + 1}/{deck.length}</span>
          <span className="fermi-hud-cat">
            <CategoryIcon category={currentQ?.category ?? ""} className="fermi-hud-cat-icon" />
            {currentQ ? CAT_LABEL[currentQ.category] ?? currentQ.category : ""}
          </span>
        </div>
        <div className="fermi-hud-center">
          <span className={`fermi-timer ${timer <= 10 ? "danger" : timer <= 20 ? "warn" : ""}`}>
            {timer}s
          </span>
        </div>
        <div className="fermi-hud-right">
          <span className="fermi-hud-score">{currentScore} pts</span>
          <span className="fermi-hud-diff">
            {[1, 2, 3].map((n) => (
              <StarIcon key={n} filled={n <= (currentQ?.difficulty ?? 1)} className="fermi-star-icon" />
            ))}
          </span>
        </div>
      </div>

      <div className="fermi-card">
        <p className="fermi-question">{currentQ?.question}</p>

        {!showResult ? (
          <div className="fermi-bounds">
            <p className="fermi-bounds-hint">
              Give a range you&rsquo;d defend. Containing the answer earns points; the tighter the range, the more
              it&rsquo;s worth.
            </p>
            <div className="fermi-input-row">
              <label className="fermi-bound-field">
                <span className="fermi-bound-label">LOW</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="fermi-input"
                  value={lowInput}
                  onChange={(e) => setLowInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. 10K"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <label className="fermi-bound-field">
                <span className="fermi-bound-label">HIGH</span>
                <input
                  type="text"
                  className="fermi-input"
                  value={highInput}
                  onChange={(e) => setHighInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. 100K"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <button type="button" className="fermi-submit-btn" onClick={handleSubmit}>
                Lock in
              </button>
            </div>
          </div>
        ) : lastResult ? (
          <div className="fermi-reveal">
            <div className={`fermi-verdict pts-${lastResult.points}`}>
              <span className="fermi-verdict-label">{lastResult.label}</span>
              <span className="fermi-verdict-pts">+{lastResult.points} pts</span>
            </div>
            <div className="fermi-comparison">
              <div className="fermi-comp-col">
                <span className="fermi-comp-label">Your range</span>
                <span className="fermi-comp-val">
                  {Number.isNaN(lastResult.low) ? "—" : formatNumber(lastResult.low)} to{" "}
                  {Number.isNaN(lastResult.high) ? "—" : formatNumber(lastResult.high)}
                </span>
              </div>
              <div className="fermi-comp-arrow">→</div>
              <div className="fermi-comp-col">
                <span className="fermi-comp-label">Actual</span>
                <span className="fermi-comp-val">{formatNumber(lastResult.q.answer)} {lastResult.q.unit}</span>
              </div>
            </div>
            <div className="fermi-oom-bar">
              <OOMBar guess={Math.sqrt(lastResult.low * lastResult.high)} truth={lastResult.q.answer} />
            </div>
            <p className="fermi-explain">{lastResult.q.explanation}</p>
            <button type="button" className="fermi-next-btn" onClick={nextQuestion}>
              {idx + 1 >= deck.length ? "See results" : "Next question →"}
            </button>
          </div>
        ) : null}
      </div>

      {/* Progress dots */}
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

// ---------- Linear range visualizer (technical mode) ----------
// Technical answers sit in a tight numeric band rather than spanning orders
// of magnitude, so a linear track between the 90%-CI bounds reads far better
// than the log-scale OOMBar used for classic Fermi.
function RangeBar({ guess, answer, low, high }: { guess: number; answer: number; low: number; high: number }) {
  const span = Math.max(high - low, 1e-9);
  const padding = span * 0.35;
  const trackMin = low - padding;
  const trackMax = high + padding;
  const toPct = (v: number) => {
    const clamped = Math.max(trackMin, Math.min(trackMax, v));
    return ((clamped - trackMin) / (trackMax - trackMin)) * 100;
  };
  const lowPct = toPct(low);
  const highPct = toPct(high);
  const answerPct = toPct(answer);
  const guessPct = Number.isFinite(guess) ? toPct(guess) : null;

  return (
    <div className="range-bar-container">
      <div className="range-bar-track">
        <div className="range-bar-band" style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }} />
        <div className="range-bar-answer" style={{ left: `${answerPct}%` }} />
        {guessPct !== null && <div className="range-bar-guess" style={{ left: `${guessPct}%` }} />}
      </div>
      <div className="range-bar-labels">
        <span>{formatNumber(low)}</span>
        <span className="range-bar-answer-label">answer: {formatNumber(answer)}</span>
        <span>{formatNumber(high)}</span>
      </div>
    </div>
  );
}

// ---------- Order-of-magnitude visualizer ----------
function OOMBar({ guess, truth }: { guess: number; truth: number }) {
  const logGuess = Math.log10(Math.max(guess, 1e-10));
  const logTruth = Math.log10(Math.max(truth, 1e-10));
  const diff = logGuess - logTruth;
  // Show a bar from -3 to +3 orders of magnitude
  const clampedDiff = Math.max(-3, Math.min(3, diff));
  const pct = ((clampedDiff + 3) / 6) * 100;
  const truthPct = 50;

  return (
    <div className="oom-bar-container">
      <div className="oom-bar-labels">
        <span>10⁻³×</span>
        <span>10⁻²×</span>
        <span>10⁻¹×</span>
        <span className="oom-center">Exact</span>
        <span>10¹×</span>
        <span>10²×</span>
        <span>10³×</span>
      </div>
      <div className="oom-bar-track">
        <div className="oom-bar-zone" />
        <div className="oom-bar-truth" style={{ left: `${truthPct}%` }} />
        <div className="oom-bar-guess" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

// Every word/abbreviation people actually type for each magnitude. A guess
// that silently drops an unrecognized suffix (e.g. "4.5 Mil" parsing as the
// literal number 4.5) is worse than useless — it grades the player against
// the wrong number without any indication anything went wrong. So this maps
// as many real-world spellings as reasonably possible instead of just k/m/b/t.
const MAGNITUDE_WORDS: Record<string, number> = {
  k: 1e3,
  ks: 1e3,
  thou: 1e3,
  thousand: 1e3,
  thousands: 1e3,

  m: 1e6,
  mm: 1e6,
  mil: 1e6,
  mils: 1e6,
  mn: 1e6,
  million: 1e6,
  millions: 1e6,

  b: 1e9,
  bn: 1e9,
  bil: 1e9,
  bils: 1e9,
  bill: 1e9,
  billion: 1e9,
  billions: 1e9,

  t: 1e12,
  tn: 1e12,
  tril: 1e12,
  trils: 1e12,
  trillion: 1e12,
  trillions: 1e12,
};

// ---------- Parse shorthand like "5M", "4.5 Mil", "1.2 billion", "3e6" ----------
function parseGuessInput(raw: string): number {
  if (!raw) return NaN;
  // Strip anything that isn't a letter/digit/dot/dash/space (currency
  // symbols, stray punctuation) so "$4.5M" or "4.5 mil." still parse.
  const s = raw.trim().toLowerCase().replace(/[^a-z0-9.\-\s]/g, "");

  // Number followed by a magnitude word, with or without a space: "4.5mil",
  // "4.5 mil", "4.5 million" all match.
  // Trailing "." allowed so an abbreviation like "mil." still matches.
  const suffixMatch = s.match(/^(-?[0-9]*\.?[0-9]+)\s*([a-z]+)\.?$/);
  if (suffixMatch) {
    const num = parseFloat(suffixMatch[1]);
    const mult = MAGNITUDE_WORDS[suffixMatch[2]];
    if (mult) return num * mult;
    // An unrecognized trailing word (typo, unit name, etc.) — better to
    // fail the parse than silently ignore it and score against a bogus
    // "bare number" reading.
    return NaN;
  }

  // Plain numbers and scientific notation: "500", "1.2e6", "-3"
  return parseFloat(s);
}
