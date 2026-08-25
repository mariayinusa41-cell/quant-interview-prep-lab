"use client";

import { useEffect, useRef, useState } from "react";
import GameLeaderboard from "../../scores/GameLeaderboard";
import {
  equityCurve,
  expectedMaxSharpe,
  generateBook,
  maxDrawdown,
  randomSeed,
  sharpeStandardError,
  totalReturn,
  type Strategy,
} from "./backtestMath";
import { ResultBanner } from "../../probability/quitters-never-lose/lottery/pick/PixelArt";
import BacktestIntro from "./BacktestIntro";

// Every level is the same question — "is the best one actually good?" — with
// the levers that decide the answer moved around: how many were tested, how
// long the history is, and whether a real edge is hiding in there at all.
const LEVELS = [
  {
    count: 20,
    days: 252,
    oos: 252,
    edgedIndex: -1,
    trueEdge: 0,
    brief: "Twenty analysts, twenty strategies, one year of history each. Pick the one to fund.",
  },
  {
    count: 20,
    days: 504,
    oos: 504,
    edgedIndex: 7,
    trueEdge: 2.2,
    brief: "Same bake-off, two years of history. This time one desk may genuinely have something.",
  },
  {
    count: 50,
    days: 252,
    oos: 252,
    edgedIndex: -1,
    trueEdge: 0,
    brief: "The firm widened the search to fifty candidates. Still one year of data each.",
  },
  {
    count: 20,
    days: 1260,
    oos: 504,
    edgedIndex: 12,
    trueEdge: 1.0,
    brief: "Twenty candidates, but five years of history apiece. A weaker edge, far more data.",
  },
];

const LEVEL_MS = 180000;

function fmtClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Spark({ returns, hot }: { returns: number[]; hot?: boolean }) {
  const curve = equityCurve(returns);
  const lo = Math.min(...curve);
  const hi = Math.max(...curve);
  const span = hi - lo || 1;
  const step = 100 / Math.max(1, curve.length - 1);
  const pts = curve.map((v, i) => `${(i * step).toFixed(2)},${(28 - ((v - lo) / span) * 26).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={hot ? "bt-spark is-hot" : "bt-spark"}>
      <polyline points={pts} fill="none" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

type Phase = "intro" | "reviewing" | "revealed" | "final";

export default function BacktestGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(0);
  const [book, setBook] = useState<Strategy[]>([]);
  const [benchmarkShown, setBenchmarkShown] = useState(false);
  const [choice, setChoice] = useState<number | "none" | null>(null);
  const [clock, setClock] = useState(LEVEL_MS);
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("");
  const [levelPoints, setLevelPoints] = useState(0);
  const deadline = useRef(0);

  const spec = LEVELS[level];

  useEffect(() => {
    if (phase !== "reviewing") return;
    const t = window.setInterval(() => {
      const left = deadline.current - Date.now();
      setClock(left);
      if (left <= 0) {
        window.clearInterval(t);
        decide("none", true);
      }
    }, 120);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, level]);

  const startLevel = (i: number) => {
    const s = LEVELS[i];
    setLevel(i);
    setBook(generateBook(randomSeed(), s.count, s.days, s.oos, s.edgedIndex, s.trueEdge));
    setBenchmarkShown(false);
    setChoice(null);
    setNote("");
    setLevelPoints(0);
    deadline.current = Date.now() + LEVEL_MS;
    setClock(LEVEL_MS);
    setPhase("reviewing");
  };

  const decide = (pick: number | "none", timedOut = false) => {
    setChoice(pick);
    const edged = spec.edgedIndex;
    const hasEdge = edged >= 0;
    let pts = 0;
    let msg = "";

    if (pick === "none") {
      if (!hasEdge) {
        pts = 200;
        msg = timedOut
          ? "The clock ran out - but declining was correct. Every strategy here was pure noise."
          : "Correct. Every strategy in that book had zero real edge. The winner only looked good because you took the best of many.";
      } else {
        pts = 40;
        msg = `Too cautious - ${book[edged].name} genuinely had an edge (true Sharpe ${spec.trueEdge}). Declining costs less than funding noise, but you left a real strategy on the table.`;
      }
    } else if (pick === edged) {
      pts = 250;
      msg = `Correct - ${book[edged].name} was the real one (true Sharpe ${spec.trueEdge}). Its out-of-sample Sharpe held at ${book[edged].oosSharpe.toFixed(2)}.`;
    } else {
      pts = 0;
      const s = book[pick as number];
      msg = hasEdge
        ? `${s.name} had no real edge - its in-sample ${s.sharpe.toFixed(2)} was luck, and it did ${s.oosSharpe.toFixed(2)} out-of-sample. The genuine one was ${book[edged].name}.`
        : `${s.name} had no real edge. Its in-sample ${s.sharpe.toFixed(2)} collapsed to ${s.oosSharpe.toFixed(2)} out-of-sample. Nothing in that book was real - the correct call was to fund none.`;
    }

    setLevelPoints(pts);
    setScore((v) => v + pts);
    setNote(msg);
    setPhase("revealed");
  };

  const se = sharpeStandardError(spec?.days ?? 252);
  const nullMax = expectedMaxSharpe(spec?.count ?? 20, se);
  const best = book.length ? book.reduce((a, b) => (b.sharpe > a.sharpe ? b : a)) : null;
  // How far past the selection-adjusted benchmark the winner actually sits.
  // A binary "real / not real" call would be dishonest here: the maximum has
  // its own spread, so the middle band genuinely is ambiguous on this evidence.
  const gapSe = best && se > 0 ? (best.sharpe - nullMax) / se : 0;
  const verdict =
    gapSe > 0.75
      ? { tone: "bt-verdict is-good", text: "Clearly beyond what selection alone produces - this one is worth a look." }
      : gapSe > 0.25
        ? {
            tone: "bt-verdict is-warn",
            text: "Above the benchmark, but not decisively. Suggestive on this much data, not conclusive.",
          }
        : { tone: "bt-verdict is-bad", text: "Right in line with what luck alone produces. No evidence of real edge." };
  const sorted = [...book].sort((a, b) => b.sharpe - a.sharpe);

  if (phase === "intro") return <BacktestIntro onDone={() => startLevel(0)} />;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">Twenty Backtests</h1>

      {phase === "reviewing" && (
        <div className="pixel-stage">
          <div className="ctb-hud">
            <span className="qty-hint">
              Level {level + 1}/{LEVELS.length}
            </span>
            <span className={clock < 30000 ? "ctb-clock is-low" : "ctb-clock"}>{fmtClock(clock)}</span>
            <span className="qty-hint">
              {spec.count} strategies · {(spec.days / 252).toFixed(0)}y
            </span>
          </div>

          <p className="mm-teach-note" style={{ marginBottom: 10 }}>
            {spec.brief}
          </p>

          {benchmarkShown ? (
            <div className="bt-benchmark">
              <p className="bt-benchmark-title">IF NOTHING HERE HAS ANY EDGE</p>
              <p>
                Sharpe standard error at {spec.days} days: <strong>{se.toFixed(2)}</strong>
              </p>
              <p>
                Expected best-of-{spec.count} under pure noise: <strong>{nullMax.toFixed(2)}</strong>
              </p>
              <p>
                Best actually observed: <strong>{best ? best.sharpe.toFixed(2) : "-"}</strong>
              </p>
              <p>
                Gap above the no-edge benchmark:{" "}
                <strong>
                  {best ? `${(best.sharpe - nullMax).toFixed(2)} (${((best.sharpe - nullMax) / se).toFixed(2)} SE)` : "-"}
                </strong>
              </p>
              <p className={verdict.tone}>{verdict.text}</p>
            </div>
          ) : (
            <button type="button" className="chip-btn" onClick={() => setBenchmarkShown(true)}>
              Compute the no-edge benchmark
            </button>
          )}

          <div className="bt-grid">
            {sorted.slice(0, 12).map((s) => (
              <button key={s.id} type="button" className="bt-card" onClick={() => decide(s.id)}>
                <span className="bt-name">{s.name}</span>
                <Spark returns={s.returns} hot={best?.id === s.id} />
                <span className="bt-metrics">
                  SR {s.sharpe.toFixed(2)} · {(totalReturn(s.returns) * 100).toFixed(0)}% · DD{" "}
                  {(maxDrawdown(s.returns) * 100).toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
          {book.length > 12 && <p className="qty-hint">Showing the top 12 of {book.length} by Sharpe.</p>}

          <button type="button" className="continue-btn" style={{ marginTop: 14 }} onClick={() => decide("none")}>
            Fund none of them
          </button>
        </div>
      )}

      {phase === "revealed" && (
        <div className="pixel-stage">
          <ResultBanner
            outcome={levelPoints >= 200 ? "win" : "loss"}
            title={levelPoints >= 200 ? "GOOD CALL" : levelPoints > 0 ? "TOO CAUTIOUS" : "FUNDED NOISE"}
            sub={`${levelPoints} points · total ${score}`}
          />
          <p className="mm-teach-note" style={{ marginTop: 12 }}>
            {note}
          </p>

          {typeof choice === "number" && book[choice] && (
            <div className="bt-oos">
              <p className="bt-benchmark-title">{book[choice].name} - OUT OF SAMPLE</p>
              <Spark returns={book[choice].outOfSample} />
              <p className="bt-metrics">
                in-sample SR {book[choice].sharpe.toFixed(2)} → out-of-sample SR {book[choice].oosSharpe.toFixed(2)}
              </p>
            </div>
          )}

          <button
            type="button"
            className="chip-btn"
            style={{ marginTop: 16 }}
            onClick={() => (level + 1 >= LEVELS.length ? setPhase("final") : startLevel(level + 1))}
          >
            {level + 1 >= LEVELS.length ? "See final score" : "Next level"}
          </button>
        </div>
      )}

      {phase === "final" && (
        <div className="pixel-stage">
          <ResultBanner
            outcome={score >= 600 ? "win" : "loss"}
            title={score >= 600 ? "CAPITAL PRESERVED" : "SESSION OVER"}
            sub={`${score} points across ${LEVELS.length} levels`}
          />
          <GameLeaderboard
            gameId="statistics-twenty-backtests"
            score={score}
            title="Twenty Backtests leaderboard"
          />
          <p className="mm-teach-note" style={{ marginTop: 12 }}>
            The habit worth keeping: before believing any backtest, ask how many were tried to find it, and what the best
            one would have looked like if none of them worked.
          </p>
          <button
            type="button"
            className="chip-btn"
            style={{ marginTop: 16 }}
            onClick={() => {
              setScore(0);
              setPhase("intro");
            }}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
