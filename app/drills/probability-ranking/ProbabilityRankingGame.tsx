"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import GameLeaderboard from "../../scores/GameLeaderboard";
import {
  curatedProbabilityQuestions,
  scoreRanking,
  type OptionItem,
  type ProbabilityRankingQuestion,
  type ScatterContext,
} from "./probabilityRankingQuestions";
import { getProceduralProbabilityQuestions } from "./proceduralProbabilityRanking";
import { AccessStartButton } from "../../access/TokenPlayButton";
// Reuses the Fermi drill's shell classes (menu/card/HUD/results/progress
// dots) so this doesn't have to redefine that whole layout from scratch.
import "../fermi/fermi.css";
import "./probRank.css";

const CATEGORIES = [
  "all",
  "student-performance",
  "distribution-density",
  "dice-and-cards",
  "poisson-arrivals",
  "bayesian-urns",
  "scatter-plots",
] as const;
const CAT_LABEL: Record<string, string> = {
  "student-performance": "Student Performance",
  "distribution-density": "Distribution Density",
  "dice-and-cards": "Dice & Cards",
  "poisson-arrivals": "Poisson Arrivals",
  "bayesian-urns": "Bayesian / Urns",
  "scatter-plots": "Read the Plot",
};
const DIFFICULTIES = ["all", "1", "2", "3"] as const;
const DIFF_LABEL: Record<string, string> = { "1": "Warm-up", "2": "Interview", "3": "Hard" };
const ROUND_COUNT = 8;

type Phase = "menu" | "playing" | "result";
type Answered = {
  q: ProbabilityRankingQuestion;
  userOrder: string[];
  points: 0 | 1 | 2 | 3;
  label: string;
  concordantPairs: number;
  totalPairs: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Renders a scatter question's x/y plane. Deliberately shows the axis
// values and the threshold guide lines: the question is "count the points
// in this region", which should be a reading exercise, not a
// pixel-eyeballing one.
function ScatterPlot({ data }: { data: ScatterContext }) {
  const W = 460, H = 300, PAD_L = 52, PAD_B = 40, PAD_T = 14, PAD_R = 14;
  const xs = data.points.map((p) => p.x);
  const ys = data.points.map((p) => p.y);
  const xMin = Math.min(...xs, ...(data.xGuides ?? []));
  const xMax = Math.max(...xs, ...(data.xGuides ?? []));
  const yMin = Math.min(...ys, ...(data.yGuides ?? []));
  const yMax = Math.max(...ys, ...(data.yGuides ?? []));
  // Pad the domain so no point sits exactly on the frame — but never pad a
  // non-negative quantity below zero, which printed axis floors like
  // "-7.2 monthly sales ($k)".
  const xPad = (xMax - xMin) * 0.08 || 1;
  const yPad = (yMax - yMin) * 0.08 || 1;
  const x0 = xMin >= 0 ? Math.max(0, xMin - xPad) : xMin - xPad;
  const y0 = yMin >= 0 ? Math.max(0, yMin - yPad) : yMin - yPad;
  const x1 = xMax + xPad, y1 = yMax + yPad;

  const sx = (x: number) => PAD_L + ((x - x0) / (x1 - x0)) * (W - PAD_L - PAD_R);
  const sy = (y: number) => H - PAD_B - ((y - y0) / (y1 - y0)) * (H - PAD_T - PAD_B);

  const xTicks = [x0, (x0 + x1) / 2, x1];
  const yTicks = [y0, (y0 + y1) / 2, y1];
  const fmtTick = (v: number) => (Math.abs(v) >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ""));

  return (
    <div className="prob-scatter-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="prob-scatter" role="img"
        aria-label={`Scatter plot of ${data.yLabel} against ${data.xLabel} with ${data.points.length} labelled points`}>
        <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B}
          fill="rgba(255,255,255,0.03)" stroke="var(--pixel-border)" strokeWidth="2" />

        {yTicks.map((t, i) => (
          <g key={`yt${i}`}>
            <text x={PAD_L - 8} y={sy(t) + 4} textAnchor="end" className="prob-scatter-tick">{fmtTick(t)}</text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={`xt${i}`} x={sx(t)} y={H - PAD_B + 18} textAnchor="middle" className="prob-scatter-tick">
            {fmtTick(t)}
          </text>
        ))}

        {(data.xGuides ?? []).map((g, i) => (
          <g key={`xg${i}`}>
            <line x1={sx(g)} y1={PAD_T} x2={sx(g)} y2={H - PAD_B}
              stroke="var(--pixel-accent, #f5c542)" strokeWidth="2" strokeDasharray="5 4" opacity="0.85" />
          </g>
        ))}
        {(data.yGuides ?? []).map((g, i) => (
          <line key={`yg${i}`} x1={PAD_L} y1={sy(g)} x2={W - PAD_R} y2={sy(g)}
            stroke="var(--pixel-accent, #f5c542)" strokeWidth="2" strokeDasharray="5 4" opacity="0.85" />
        ))}

        {/* Nudge a label that would land on top of an already-placed one.
            Points this close are still individually countable, but the text
            was overlapping into an unreadable smudge. */}
        {(() => {
          const placed: Array<{ x: number; y: number }> = [];
          return data.points.map((p, i) => {
            const px = sx(p.x), py = sy(p.y);
            let lx = px + 8, ly = py + 3;
            for (let guard = 0; guard < 6; guard++) {
              const clash = placed.some((q) => Math.abs(q.x - lx) < 44 && Math.abs(q.y - ly) < 11);
              if (!clash) break;
              ly += 11;
            }
            placed.push({ x: lx, y: ly });
            return (
              <g key={i}>
                <rect x={px - 4} y={py - 4} width="8" height="8" fill="var(--pixel-good, #47f0c2)" />
                <text x={lx} y={ly} className="prob-scatter-point-label">{p.label}</text>
              </g>
            );
          });
        })()}

        <text x={(PAD_L + W - PAD_R) / 2} y={H - 4} textAnchor="middle" className="prob-scatter-axis">
          {data.xLabel}{data.xUnit ? ` (${data.xUnit})` : ""}
        </text>
        <text x={12} y={(PAD_T + H - PAD_B) / 2} textAnchor="middle" className="prob-scatter-axis"
          transform={`rotate(-90 12 ${(PAD_T + H - PAD_B) / 2})`}>
          {data.yLabel}{data.yUnit ? ` (${data.yUnit})` : ""}
        </text>
      </svg>
    </div>
  );
}

export default function ProbabilityRankingGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [diffFilter, setDiffFilter] = useState<string>("all");

  // Regenerated fresh every menu visit, same as the other drills' procedural
  // pools, so replaying doesn't feel like the same fixed set.
  const [proceduralPool, setProceduralPool] = useState<ProbabilityRankingQuestion[]>(() =>
    getProceduralProbabilityQuestions()
  );

  const [deck, setDeck] = useState<ProbabilityRankingQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  // The order the player has currently arranged the options into. Seeded
  // shuffled per question — the authored option order in several generators
  // (distribution-density in particular) already happens to run
  // most-to-least-likely, so handing that straight to the UI would make the
  // "task" just leaving the list alone. Always scramble on load.
  const [order, setOrder] = useState<OptionItem[]>([]);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<Answered | null>(null);
  const [timer, setTimer] = useState(40);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const orderRef = useRef<OptionItem[]>([]);
  orderRef.current = order;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("prob-rank-best");
      if (stored) setBestScore(Number(stored));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (phase === "menu") {
      setProceduralPool(getProceduralProbabilityQuestions());
    }
  }, [phase]);

  const allQuestions = useMemo(
    () => [...curatedProbabilityQuestions, ...proceduralPool],
    [proceduralPool]
  );

  const currentQ = deck[idx] ?? null;
  const totalPossible = deck.length * 3;
  const currentScore = answered.reduce((s, a) => s + a.points, 0);
  // Kept in a ref alongside state so the timer-expiry effect below can read
  // the latest question without adding it to a dependency array (which
  // would restart the countdown on every unrelated re-render).
  const currentQRef = useRef<ProbabilityRankingQuestion | null>(null);
  currentQRef.current = currentQ;

  function submitCurrent() {
    const q = currentQRef.current;
    if (!q) return;
    const userOrder = orderRef.current.map((o) => o.id);
    const result = scoreRanking(userOrder, q.correctRankOrder);
    const a: Answered = { q, userOrder, ...result };
    setLastResult(a);
    setAnswered((prev) => [...prev, a]);
    setShowResult(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // Timer countdown, keyed to each question's own timeLimitSec.
  useEffect(() => {
    if (phase !== "playing" || showResult || !currentQ) return;
    setTimer(currentQ.timeLimitSec);
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    timerRef.current = id;
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, showResult]);

  useEffect(() => {
    if (timer <= 0 && phase === "playing" && !showResult) {
      submitCurrent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  function startGame() {
    let pool = allQuestions;
    if (catFilter !== "all") pool = pool.filter((q) => q.category === catFilter);
    if (diffFilter !== "all") pool = pool.filter((q) => q.difficulty === Number(diffFilter));
    if (pool.length === 0) return;
    const d = shuffle(pool).slice(0, ROUND_COUNT);
    setDeck(d);
    setIdx(0);
    setOrder(shuffle(d[0].options));
    setAnswered([]);
    setShowResult(false);
    setLastResult(null);
    setPhase("playing");
  }

  function moveItem(index: number, direction: -1 | 1) {
    if (showResult) return;
    const next = index + direction;
    if (next < 0 || next >= order.length) return;
    const updated = [...order];
    [updated[index], updated[next]] = [updated[next], updated[index]];
    setOrder(updated);
  }

  function nextQuestion() {
    if (idx + 1 >= deck.length) {
      const final = answered.reduce((s, a) => s + a.points, 0);
      if (bestScore === null || final > bestScore) {
        setBestScore(final);
        try { localStorage.setItem("prob-rank-best", String(final)); } catch { /* noop */ }
      }
      setPhase("result");
      return;
    }
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    setOrder(shuffle(deck[nextIdx].options));
    setShowResult(false);
    setLastResult(null);
  }

  const availableCount = useMemo(() => {
    let pool = allQuestions;
    if (catFilter !== "all") pool = pool.filter((q) => q.category === catFilter);
    if (diffFilter !== "all") pool = pool.filter((q) => q.difficulty === Number(diffFilter));
    return pool.length;
  }, [allQuestions, catFilter, diffFilter]);

  // ---------- MENU ----------
  if (phase === "menu") {
    return (
      <div className="fermi-container prob-rank-container">
        <div className="fermi-menu">
          <h1 className="fermi-title">Likelihood Ranking</h1>
          <p className="fermi-subtitle">
            Given a table, a set of distributions, or a handful of dice/card/urn events - order them from
            most likely to least likely. The "which is most likely" screen question, in drill form.
          </p>

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
                    {c === "all" ? "All" : CAT_LABEL[c]}
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
            gameId="drills-probability-ranking"
            title="Likelihood Ranking"
            defaultLabel={availableCount === 0 ? "No questions match" : `Start (${Math.min(ROUND_COUNT, availableCount)} questions)`}
            className="fermi-start-btn"
            onStart={startGame}
          >
            {availableCount === 0 ? "No questions match" : `Start (${Math.min(ROUND_COUNT, availableCount)} questions)`}
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
      <div className="fermi-container prob-rank-container">
        <div className="fermi-results">
          <h2 className="fermi-title">
            {pct >= 80 ? "Superb!" : pct >= 50 ? "Solid reads" : pct >= 25 ? "Keep practicing" : "Rough day"}
          </h2>
          <div className="fermi-final-score">
            <span className="fermi-score-big">{score}</span>
            <span className="fermi-score-of">/ {maxPts}</span>
          </div>
          <p className="fermi-pct">{pct}% accuracy</p>

          <GameLeaderboard gameId={"drills-probability-ranking"} score={score} accuracy={pct} title="Likelihood Ranking leaderboard" />

          <div className="fermi-review">
            {answered.map((a, i) => (
              <div key={a.q.id} className={`fermi-review-row ${a.points === 3 ? "bull" : a.points >= 1 ? "ok" : "miss"}`}>
                <div className="fermi-review-num">Q{i + 1}</div>
                <div className="fermi-review-body">
                  <p className="fermi-review-q">{a.q.title}</p>
                  <ol className="prob-review-order">
                    {a.q.correctRankOrder.map((id, rankIdx) => {
                      const opt = a.q.options.find((o) => o.id === id)!;
                      const userIdx = a.userOrder.indexOf(id);
                      const gotItRight = userIdx === rankIdx;
                      return (
                        <li key={id} className={gotItRight ? "correct" : "wrong"}>
                          {opt.label} - <strong>{opt.formattedProb}</strong>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="fermi-review-explain">{a.q.explanation}</p>
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
    <div className="fermi-container prob-rank-container">
      <div className="fermi-hud">
        <div className="fermi-hud-left">
          <span className="fermi-hud-q">Q{idx + 1}/{deck.length}</span>
          <span className="fermi-hud-cat">{currentQ ? CAT_LABEL[currentQ.category] ?? currentQ.category : ""}</span>
        </div>
        <div className="fermi-hud-center">
          <span className={`fermi-timer ${timer <= 10 ? "danger" : timer <= 20 ? "warn" : ""}`}>{timer}s</span>
        </div>
        <div className="fermi-hud-right">
          <span className="fermi-hud-score">{currentScore} pts</span>
        </div>
      </div>

      <div className="fermi-card prob-rank-card">
        <h3 className="prob-title">{currentQ?.title}</h3>
        <p className="prob-scenario">{currentQ?.scenarioText}</p>

        {currentQ?.tableData && (
          <div className="prob-table-wrapper">
            <table className="prob-table">
              <thead>
                <tr>
                  <th></th>
                  {currentQ.tableData.columns.slice(1).map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentQ.tableData.rows.map((row, i) => (
                  <tr key={i}>
                    <td className="name-col">{row.name}</td>
                    {row.values.map((val, vIdx) => (
                      <td key={vIdx}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentQ?.scatterData && <ScatterPlot data={currentQ.scatterData} />}

        {currentQ?.distributionData && (
          <div className="prob-dist-grid">
            {currentQ.distributionData.items.map((item, i) => (
              <div key={i} className="prob-dist-card">
                <div className="prob-dist-name">{item.name}</div>
                <div className="prob-dist-desc">{item.description}</div>
              </div>
            ))}
          </div>
        )}

        <div className="prob-ranking-list">
          {order.map((item, i) => (
            <div key={item.id} className="prob-rank-slot">
              <span className="prob-rank-badge">#{i + 1}</span>
              <span className="prob-rank-text">{item.label}</span>
              {!showResult ? (
                <div className="prob-move-btns">
                  <button type="button" className="prob-btn-arrow" onClick={() => moveItem(i, -1)} disabled={i === 0}>
                    ▲
                  </button>
                  <button
                    type="button"
                    className="prob-btn-arrow"
                    onClick={() => moveItem(i, 1)}
                    disabled={i === order.length - 1}
                  >
                    ▼
                  </button>
                </div>
              ) : (
                <span className="prob-rank-prob">{item.formattedProb}</span>
              )}
            </div>
          ))}
        </div>

        {!showResult ? (
          <button type="button" className="fermi-submit-btn prob-submit-btn" onClick={submitCurrent}>
            Lock in ranking
          </button>
        ) : lastResult ? (
          <div className="fermi-reveal">
            <div className={`fermi-verdict pts-${lastResult.points}`}>
              <span className="fermi-verdict-label">
                {lastResult.label} ({lastResult.concordantPairs}/{lastResult.totalPairs} pairs correct)
              </span>
              <span className="fermi-verdict-pts">+{lastResult.points} pts</span>
            </div>
            <p className="fermi-review-q" style={{ marginTop: "0.5rem" }}>Correct order (most → least likely):</p>
            <ol className="prob-review-order">
              {lastResult.q.correctRankOrder.map((id) => {
                const opt = lastResult.q.options.find((o) => o.id === id)!;
                return (
                  <li key={id}>
                    {opt.label} - <strong>{opt.formattedProb}</strong>
                    <div className="prob-rationale">{opt.rationale}</div>
                  </li>
                );
              })}
            </ol>
            <p className="fermi-explain">{lastResult.q.explanation}</p>
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
