"use client";

import { useMemo, useRef, useState } from "react";
import { generateCase, LEVEL_COUNT, type ConcurrencyCase } from "../concurrencyBugs";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Stage = "brief" | "findLine" | "pickFix" | "summary";

export default function ConcurrencyGame() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();

  const [stage, setStage] = useState<Stage>("brief");
  const [level, setLevel] = useState(1);
  const [current, setCurrent] = useState<ConcurrencyCase | null>(null);
  const lastTemplateIndex = useRef<number | undefined>(undefined);

  const [linePick, setLinePick] = useState<number | null>(null);
  const [lineChecked, setLineChecked] = useState(false);
  const [fixPick, setFixPick] = useState<number | null>(null);
  const [fixChecked, setFixChecked] = useState(false);

  const [lineScore, setLineScore] = useState(0);
  const [fixScore, setFixScore] = useState(0);
  const [casesSeen, setCasesSeen] = useState(0);
  const [retries, setRetries] = useState(0);
  const [maxLevelReached, setMaxLevelReached] = useState(1);

  // Shuffled per case so the correct fix is not always in the same slot.
  const fixOrder = useMemo(
    () => (current ? shuffle(current.fixes.map((_, i) => i)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id],
  );

  function loadCase(atLevel: number) {
    const { case: next, templateIndex } = generateCase(atLevel, lastTemplateIndex.current);
    lastTemplateIndex.current = templateIndex;
    setCurrent(next);
    setCasesSeen((n) => n + 1);
    setMaxLevelReached((m) => Math.max(m, atLevel));
    setStage("findLine");
    setLinePick(null); setLineChecked(false);
    setFixPick(null); setFixChecked(false);
  }

  const start = () => {
    setLevel(1);
    lastTemplateIndex.current = undefined;
    setLineScore(0); setFixScore(0); setCasesSeen(0); setRetries(0); setMaxLevelReached(1);
    loadCase(1);
    startMusic("game");
  };

  function checkLine() {
    if (lineChecked || linePick === null || !current) return;
    const ok = linePick === current.bugLine;
    recordAttempt("coding-implementation", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setLineScore((s) => s + 1);
    setLineChecked(true);
  }

  function checkFix() {
    if (fixChecked || fixPick === null || !current) return;
    const ok = current.fixes[fixPick].correct;
    recordAttempt("data-structures", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setFixScore((s) => s + 1);
    setFixChecked(true);
  }

  function next() {
    if (!current) return;
    const passed = linePick === current.bugLine && fixPick !== null && current.fixes[fixPick].correct;
    if (passed) {
      if (level >= LEVEL_COUNT) {
        setStage("summary");
        return;
      }
      const nextLevel = level + 1;
      setLevel(nextLevel);
      loadCase(nextLevel);
    } else {
      setRetries((r) => r + 1);
      loadCase(level);
    }
  }

  function restart() {
    start();
  }

  if (stage === "brief") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">Five levels. Every snippet is generated fresh. Each one is already in production, and each one is broken.</p>
          <p>
            Every case here compiles, passes review, and works on a developer laptop. They fail under
            load, on the wrong interleaving, on the wrong architecture. Find the line, then name the
            fix. Clear a level to face a harder one; miss it and you get a new case at the same level,
            never the one you just saw.
          </p>
          <div className="lab-topic-grid">
            {[
              ["LV.1 · DATA RACES", "and why volatile is not the answer"],
              ["LV.2 · CONDITION VARS", "spurious wakeups, check-then-act"],
              ["LV.3 · MEMORY ORDER", "release/acquire publishing"],
              ["LV.4 · DEADLOCK", "lock ordering, lost wakeups"],
              ["LV.5 · SUBTLE BUGS", "hidden ordering, ABA, red herrings"],
            ].map(([t, s]) => <div key={t}><strong>{t}</strong><span>{s}</span></div>)}
          </div>
          <p className="mm-step-hint">
            Read-only, deliberately: this page cannot compile or run C++, so nothing here pretends to
            be a sanitizer verdict. It tests what the interview tests — reading concurrent code and
            saying precisely what is wrong with it.
          </p>
          <AccessStartButton
            gameId="quantdev-concurrency"
            title="Concurrency Clash"
            defaultLabel="Start review"
            className="continue-btn"
            onStart={start}
          >
            Start the code review
          </AccessStartButton>
        </div>
      </div>
    );
  }

  if (stage === "summary") {
    const total = casesSeen * 2;
    const got = lineScore + fixScore;
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="lab-hud">
          <span>LEVEL REACHED <strong>{maxLevelReached}/{LEVEL_COUNT}</strong></span>
          <span>RETRIES <strong>{retries}</strong></span>
          <span>TOTAL <strong>{got}/{total}</strong></span>
        </div>
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Review complete — all five levels cleared</p>
          <p className="mm-step-hint">
            The pattern across all five: none of these are bugs in the logic. Each one is code that
            is correct as a sequence of statements and wrong as a concurrent program — which is why
            reading for races is a separate skill from reading for correctness. Run it again for a
            fresh set of cases at every level.
          </p>
          <AccessStartButton
            gameId="quantdev-concurrency"
            title="Concurrency Clash"
            defaultLabel="Review again"
            className="continue-btn"
            onStart={restart}
          >
            Run the review again
          </AccessStartButton>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <div className="lab-hud">
        <span>LEVEL <strong>{level}/{LEVEL_COUNT}</strong></span>
        <span>FOUND <strong>{lineScore}</strong></span>
        <span>FIXED <strong>{fixScore}</strong></span>
        {retries > 0 && <span>RETRIES <strong>{retries}</strong></span>}
      </div>

      <div className="cc-premise">
        <p className="did-trends-title">{current.title}</p>
        <p>{current.premise}</p>
      </div>

      <div className="cc-code" role="group" aria-label="Source under review">
        {current.code.map((line, i) => {
          const n = i + 1;
          const blank = line.trim() === "";
          const isBug = n === current.bugLine;
          const cls = [
            "cc-line",
            lineChecked && isBug ? "is-bug" : "",
            lineChecked && linePick === n && !isBug ? "is-wrongpick" : "",
            !lineChecked && linePick === n ? "is-picked" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              type="button"
              key={n}
              className={cls}
              disabled={lineChecked || blank}
              onClick={() => setLinePick(n)}
              aria-pressed={linePick === n}
            >
              <span className="cc-lineno">{n}</span>
              <code>{line || " "}</code>
            </button>
          );
        })}
      </div>

      {stage === "findLine" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Which line carries the defect?</p>
          {!lineChecked ? (
            <button type="button" className="calc-submit-btn" disabled={linePick === null} onClick={checkLine}>
              Flag line {linePick ?? "—"}
            </button>
          ) : (
            <>
              <p className={linePick === current.bugLine ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                <strong>Line {current.bugLine} — {current.bugName}.</strong> {current.bugExplain}
              </p>
              <button type="button" className="continue-btn" onClick={() => setStage("pickFix")}>
                Now fix it →
              </button>
            </>
          )}
        </div>
      )}

      {stage === "pickFix" && (
        <div className="stochastic-explain">
          <p className="quiz-panel-title">Which fix would you take to review?</p>
          <p className="mm-step-hint">
            More than one of these may remove the symptom. Pick the one that addresses the defect
            without paying for more than it needs.
          </p>
          <div className="conf-list">
            {fixOrder.map((fi) => {
              const f = current.fixes[fi];
              return (
                <button
                  type="button"
                  key={fi}
                  disabled={fixChecked}
                  className={
                    fixChecked
                      ? f.correct ? "conf-card is-answer" : fixPick === fi ? "conf-card is-wrong" : "conf-card"
                      : fixPick === fi ? "conf-card is-on" : "conf-card"
                  }
                  onClick={() => setFixPick(fi)}
                >
                  <strong><code className="cc-fix">{f.text}</code></strong>
                  {fixChecked && <em>{f.correct ? "BEST FIX — " : ""}{f.why}</em>}
                </button>
              );
            })}
          </div>

          {!fixChecked ? (
            <button type="button" className="calc-submit-btn" disabled={fixPick === null} onClick={checkFix}>
              Submit fix
            </button>
          ) : (
            <button type="button" className="continue-btn" onClick={next}>
              {(() => {
                const passed = linePick === current.bugLine && fixPick !== null && current.fixes[fixPick].correct;
                if (passed) return level >= LEVEL_COUNT ? "Finish review →" : `Advance to level ${level + 1} →`;
                return "Try level again →";
              })()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
