"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Assessment,
  AttemptResult,
  Item,
  ItemResult,
  SectionResult,
} from "./types";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";
import { runAssessmentCode, type CodeRunResult } from "./runAssessmentCode";

type Stage = "lobby" | "sectionCard" | "running" | "review";

function clockOf(sec: number): string {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AssessmentRunner({ assessment }: { assessment: Assessment }) {
  const { recordAttempt } = useProgress();
  const { playSfx, stopMusic } = useSound();

  const [stage, setStage] = useState<Stage>("lobby");
  const [sectionIdx, setSectionIdx] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [itemIdx, setItemIdx] = useState(0);
  const [given, setGiven] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(0);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [attempt, setAttempt] = useState<AttemptResult | null>(null);

  // Code items keep their own editor buffer and last run, keyed by item id so
  // moving between problems does not lose work.
  const [code, setCode] = useState<Record<string, string>>({});
  const [runs, setRuns] = useState<Record<string, CodeRunResult>>({});
  const [running, setRunning] = useState(false);

  // Shown in the header the way a real proctored session displays a
  // candidate reference. Generated once per mount.
  const sessionId = useMemo(
    () => `AS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    [],
  );

  const startedAt = useRef(0);
  const itemShownAt = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const section = assessment.sections[sectionIdx];
  const item = items[itemIdx];

  // ---- grading -------------------------------------------------------
  const isCorrect = useCallback((it: Item, raw: string | undefined): boolean => {
    // Code items are scored from their last successful run, so an untouched
    // problem simply never records a submission.
    if (it.kind === "code") return raw === "solved";
    if (raw === undefined || raw.trim() === "" || it.answer === undefined) return false;
    if (it.kind === "choice") return Number(raw) === it.answer;
    const v = Number(raw);
    if (Number.isNaN(v)) return false;
    return Math.abs(v - it.answer) <= (it.tolerance ?? 0);
  }, []);

  const finishSection = useCallback(() => {
    const rows: ItemResult[] = items.map((it) => {
      const raw = given[it.id];
      const answered = raw !== undefined && raw.trim() !== "";
      const correct = isCorrect(it, raw);
      return { itemId: it.id, skill: it.skill, answered, correct, ms: 0, given: raw };
    });

    const correct = rows.filter((r) => r.correct).length;
    const wrong = rows.filter((r) => r.answered && !r.correct).length;
    const skipped = rows.length - correct - wrong;

    // Every graded item feeds the same skill ledger the games use, so an
    // assessment moves tickets and accuracy exactly like practice does.
    rows.forEach((r) => {
      if (r.answered) recordAttempt(r.skill, r.correct ? "correct" : "incorrect");
    });

    const sr: SectionResult = {
      sectionId: section.id,
      name: section.name,
      raw: correct - wrong * section.penalty,
      attempted: correct + wrong,
      correct, wrong, skipped,
      total: rows.length,
    };

    const allSectionResults = [...sectionResults, sr];
    const allResults = [...results, ...rows];
    setSectionResults(allSectionResults);
    setResults(allResults);

    if (sectionIdx + 1 < assessment.sections.length) {
      setSectionIdx((i) => i + 1);
      setStage("sectionCard");
      return;
    }

    const scaled = allSectionResults.reduce((a, s) => a + s.raw, 0);
    const maxScaled = allSectionResults.reduce((a, s) => a + s.total, 0);
    setAttempt({
      assessmentId: assessment.id,
      startedAt: startedAt.current,
      finishedAt: Date.now(),
      sections: allSectionResults,
      items: allResults,
      scaled, maxScaled,
    });
    setStage("review");
  }, [items, given, isCorrect, section, sectionResults, results, sectionIdx, assessment, recordAttempt]);

  // ---- timer ---------------------------------------------------------
  useEffect(() => {
    if (stage !== "running") return;
    if (remaining <= 0) { finishSection(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, remaining, finishSection]);

  // Keep focus in the answer box so a numeric section plays like the real
  // thing: type, Enter, next — no mouse.
  useEffect(() => {
    if (stage === "running" && item?.kind === "numeric") inputRef.current?.focus();
  }, [stage, itemIdx, item]);

  function beginAssessment() {
    startedAt.current = Date.now();
    stopMusic(); // an exam should be silent
    setSectionIdx(0);
    setResults([]);
    setSectionResults([]);
    setStage("sectionCard");
  }

  function beginSection() {
    const generated = section.generate();
    // Seed each code editor with its starter so the buffer is never empty.
    const seed: Record<string, string> = {};
    generated.forEach((it) => { if (it.kind === "code" && it.starter) seed[it.id] = it.starter; });
    setCode(seed);
    setRuns({});
    setItems(generated);
    setItemIdx(0);
    setGiven({});
    setRemaining(section.seconds);
    itemShownAt.current = Date.now();
    setStage("running");
  }

  function commit(raw: string) {
    if (!item) return;
    setGiven((g) => ({ ...g, [item.id]: raw }));
    playSfx("select");
    advance();
  }

  async function submitCode() {
    if (!item || item.kind !== "code" || running) return;
    setRunning(true);
    const result = await runAssessmentCode(
      code[item.id] ?? item.starter ?? "",
      item.functionName ?? "solve",
      item.tests ?? [],
      item.perf,
    );
    setRuns((r) => ({ ...r, [item.id]: result }));
    // Only a fully solved problem counts; a partial pass is still a fail on a
    // real screen.
    setGiven((g) => ({ ...g, [item.id]: result.solved ? "solved" : "attempted" }));
    setRunning(false);
  }

  function advance() {
    if (itemIdx + 1 >= items.length) { finishSection(); return; }
    setItemIdx((i) => i + 1);
    itemShownAt.current = Date.now();
  }

  // ---------------------------------------------------------------- lobby
  if (stage === "lobby") {
    const totalSeconds = assessment.sections.reduce((a, x) => a + x.seconds, 0);
    return (
      <>
        <header className="exam-header">
          <h1 className="exam-header-title">{assessment.title}</h1>
          <div className="exam-header-meta">
            <span>Session <b>{sessionId}</b></span>
            <span>Duration <b>{Math.round(totalSeconds / 60)} min</b></span>
          </div>
        </header>

        <section className="exam-panel">
          <p className="exam-eyebrow">{assessment.firm}</p>
          <h2 className="exam-h1">Instructions</h2>
          <p className="exam-lead">{assessment.blurb}</p>

          <ul className="exam-instructions">
            {assessment.rules.map((r) => <li key={r}>{r}</li>)}
          </ul>

          <table className="exam-table">
            <thead>
              <tr><th>#</th><th>Section</th><th>Items</th><th>Time</th><th>Marking</th></tr>
            </thead>
            <tbody>
              {assessment.sections.map((x, i) => (
                <tr key={x.id}>
                  <td className="exam-num">{i + 1}</td>
                  <td><strong>{x.name}</strong>{x.brief}</td>
                  <td className="exam-num">{x.itemCount}</td>
                  <td className="exam-num">{clockOf(x.seconds)}</td>
                  <td className="exam-num">{x.penalty > 0 ? `−${x.penalty}` : "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="exam-notice">
            Once started, the timer runs continuously and cannot be paused. Navigating away from or
            refreshing this page will end the section in progress. Ensure you will not be interrupted
            before you begin.
          </div>

          <button type="button" className="exam-btn" onClick={beginAssessment}>
            Begin assessment
          </button>
        </section>
      </>
    );
  }

  // --------------------------------------------------------- section card
  if (stage === "sectionCard") {
    return (
      <>
        <header className="exam-header">
          <h1 className="exam-header-title">{assessment.title}</h1>
          <div className="exam-header-meta">
            <span>Session <b>{sessionId}</b></span>
            <span>Section <b>{sectionIdx + 1} of {assessment.sections.length}</b></span>
          </div>
        </header>

        <section className="exam-panel">
          <p className="exam-eyebrow">Section {sectionIdx + 1}</p>
          <h2 className="exam-h1">{section.name}</h2>
          <p className="exam-lead">{section.brief}</p>

          <table className="exam-table">
            <tbody>
              <tr><td><strong>Time limit</strong></td><td className="exam-num">{clockOf(section.seconds)}</td></tr>
              <tr>
                <td><strong>Marking</strong></td>
                <td className="exam-num">
                  {section.penalty > 0
                    ? `+1 correct, −${section.penalty} incorrect, 0 unanswered`
                    : "+1 correct, 0 otherwise"}
                </td>
              </tr>
              <tr><td><strong>Review previous items</strong></td><td className="exam-num">{section.allowBack ? "Permitted" : "Not permitted"}</td></tr>
            </tbody>
          </table>

          {section.penalty > 0 && (
            <div className="exam-notice">
              This section applies a penalty of {section.penalty} point
              {section.penalty > 1 ? "s" : ""} for each incorrect answer. Unanswered items score
              zero. Answer only where you can eliminate options.
            </div>
          )}

          <button type="button" className="exam-btn" onClick={beginSection}>
            Start section {sectionIdx + 1}
          </button>
        </section>
      </>
    );
  }

  // -------------------------------------------------------------- running
  if (stage === "running" && item) {
    const low = remaining <= 30;
    return (
      <>
        <header className="exam-header">
          <h1 className="exam-header-title">{assessment.title}</h1>
          <div className="exam-header-meta">
            <span>Session <b>{sessionId}</b></span>
            <span>Section <b>{sectionIdx + 1}/{assessment.sections.length}</b></span>
          </div>
        </header>

        <div className="exam-bar">
          <span className="exam-bar-name">{section.name}</span>
          <span className="exam-bar-count">Question {itemIdx + 1} of {items.length}</span>
          <span className={low ? "exam-clock is-low" : "exam-clock"}>{clockOf(remaining)}</span>
        </div>
        <div className="exam-track"><span style={{ width: `${(itemIdx / items.length) * 100}%` }} /></div>

        <div className={item.kind === "code" ? "exam-stage is-code" : "exam-stage"}>
          {item.kind === "code" ? (
            <div className="exam-code">
              <div className="exam-code-left">
                <h2 className="exam-code-title">{item.prompt}</h2>
                <p className="exam-code-desc">{item.description}</p>
                <p className="exam-code-sig">
                  Implement <code>{item.functionName}</code>. Your submission is run against hidden
                  test cases.
                </p>
                {item.perf && <p className="exam-code-perf">{item.perf.note}</p>}

                {runs[item.id] && (
                  <div className="exam-results">
                    {runs[item.id].crashed ? (
                      <p className="exam-run-error">
                        {runs[item.id].timedOut ? "Timed out. " : "Error. "}
                        {runs[item.id].crashMessage}
                      </p>
                    ) : (
                      <>
                        {runs[item.id].cases.map((c, k) => (
                          <div className={c.passed ? "exam-case is-pass" : "exam-case is-fail"} key={k}>
                            <span>{c.passed ? "PASS" : "FAIL"}</span>
                            <span>{c.label}</span>
                            {c.error && <em>{c.error}</em>}
                          </div>
                        ))}
                        {runs[item.id].ratio !== undefined && (
                          <div className={runs[item.id].perfPassed ? "exam-case is-pass" : "exam-case is-fail"}>
                            <span>{runs[item.id].perfPassed ? "PASS" : "FAIL"}</span>
                            <span>
                              Performance — {runs[item.id].ratio!.toFixed(1)}× reference
                              {" "}({runs[item.id].candidateMs!.toFixed(1)}ms vs{" "}
                              {runs[item.id].referenceMs!.toFixed(1)}ms)
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="exam-code-right">
                <textarea
                  className="exam-editor"
                  spellCheck={false}
                  value={code[item.id] ?? item.starter ?? ""}
                  onChange={(e) => setCode((c) => ({ ...c, [item.id]: e.target.value }))}
                  aria-label={`Solution for ${item.prompt}`}
                />
                <div className="exam-code-actions">
                  <button type="button" className="exam-btn" onClick={submitCode} disabled={running}>
                    {running ? "Running tests…" : "Run tests"}
                  </button>
                  <button
                    type="button"
                    className="exam-btn is-secondary"
                    onClick={() => setCode((c) => ({ ...c, [item.id]: item.starter ?? "" }))}
                  >
                    Reset
                  </button>
                  <button type="button" className="exam-btn is-secondary" onClick={advance}>
                    {itemIdx + 1 >= items.length ? "Finish section" : "Next problem"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {item.block && <pre className="exam-data">{item.block}</pre>}
              <p className="exam-question">{item.prompt}</p>

          {item.kind === "numeric" ? (
            <form
              className="exam-form"
              onSubmit={(e) => {
                e.preventDefault();
                const v = (inputRef.current?.value ?? "").trim();
                if (v === "") return;
                if (inputRef.current) inputRef.current.value = "";
                commit(v);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="exam-input"
                aria-label="Your answer"
              />
              <button type="submit" className="exam-btn">Submit</button>
            </form>
          ) : (
            <div className="exam-options">
              {item.choices?.map((c, i2) => (
                <button type="button" key={c} className="exam-option" onClick={() => commit(String(i2))}>
                  <span>{String.fromCharCode(65 + i2)}</span>{c}
                </button>
              ))}
            </div>
          )}

              <button type="button" className="exam-skip" onClick={advance}>
                Skip this question
              </button>
            </>
          )}
        </div>

        <p className="exam-foot">
          {section.penalty > 0
            ? `Incorrect answers are penalised ${section.penalty} point. Unanswered questions score zero.`
            : "Unanswered questions score zero."}
        </p>
      </>
    );
  }

  // --------------------------------------------------------------- review
  if (stage === "review" && attempt) {
    const pct = attempt.maxScaled > 0
      ? Math.max(0, Math.round((attempt.scaled / attempt.maxScaled) * 100))
      : 0;
    const mins = Math.max(1, Math.round((attempt.finishedAt - attempt.startedAt) / 60000));
    return (
      <>
        <header className="exam-header">
          <h1 className="exam-header-title">{assessment.title}</h1>
          <div className="exam-header-meta">
            <span>Session <b>{sessionId}</b></span>
            <span>Status <b>Submitted</b></span>
          </div>
        </header>

        <section className="exam-panel">
          <p className="exam-eyebrow">Result summary</p>
          <p className="exam-score">{attempt.scaled} / {attempt.maxScaled}</p>
          <p className="exam-score-sub">
            Net score after penalties · {pct}% of maximum · completed in {mins} minute{mins === 1 ? "" : "s"}
          </p>

          <table className="exam-table">
            <thead>
              <tr><th>Section</th><th>Correct</th><th>Incorrect</th><th>Unanswered</th><th>Net</th></tr>
            </thead>
            <tbody>
              {attempt.sections.map((x) => (
                <tr key={x.sectionId}>
                  <td><strong>{x.name}</strong>{x.total} items</td>
                  <td className="exam-num">{x.correct}</td>
                  <td className="exam-num">{x.wrong}</td>
                  <td className="exam-num">{x.skipped}</td>
                  <td className="exam-num">{x.raw}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="exam-notice">
            No percentile is reported. Ranking a score requires a comparison population, which this
            assessment does not yet have.
          </div>

          <a href="/" className="exam-btn is-secondary">Exit session</a>
        </section>
      </>
    );
  }

  return null;
}
