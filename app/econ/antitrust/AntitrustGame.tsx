"use client";

import { useMemo, useState, useEffect } from "react";
import {
  concentrationBand,
  hhi,
  hhiAfterMerger,
  screenMerger,
  shares,
} from "../antitrustMath";
import { CASES, type CaseStudy } from "./cases";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";

type Phase = "brief" | "define" | "compute" | "verdict";

const VERDICT_COPY = {
  unlikely: "Unlikely to harm competition — cleared.",
  scrutiny: "Raises significant concerns — full investigation.",
  presumed: "Presumed to enhance market power — challenge it.",
};

const CASE_KEYS = Object.keys(CASES);

export default function AntitrustGame() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();

  const [activeCaseId, setActiveCaseId] = useState<string>("kroger");
  const [isMounted, setIsMounted] = useState(false);

  const currentCase: CaseStudy = CASES[activeCaseId];

  const [phase, setPhase] = useState<Phase>("brief");
  const [included, setIncluded] = useState<string[]>([]);
  const [defineChecked, setDefineChecked] = useState(false);
  const [deltaInput, setDeltaInput] = useState("");
  const [deltaChecked, setDeltaChecked] = useState(false);
  const [verdictPick, setVerdictPick] = useState<keyof typeof VERDICT_COPY | null>(null);
  const [verdictChecked, setVerdictChecked] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize a random case immediately on the client
  useEffect(() => {
    const randomId = CASE_KEYS[Math.floor(Math.random() * CASE_KEYS.length)];
    setActiveCaseId(randomId);
    setIsMounted(true);
  }, []);

  const loadRandomCase = () => {
    // Pick a new case that isn't the one we just played
    const available = CASE_KEYS.filter((id) => id !== activeCaseId);
    const nextId = available[Math.floor(Math.random() * available.length)] || CASE_KEYS[0];
    
    setActiveCaseId(nextId);
    setPhase("brief");
    setIncluded([]);
    setDefineChecked(false);
    setDeltaInput("");
    setDeltaChecked(false);
    setVerdictPick(null);
    setVerdictChecked(false);
  };

  const toggle = (id: string) =>
    setIncluded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Live market calculation
  const liveRevenues = useMemo(
    () => [
      ...currentCase.core.map((c) => c.revenue),
      ...currentCase.candidates
        .filter((c) => included.includes(c.id))
        .flatMap((c) => c.firms),
    ],
    [currentCase, included]
  );
  const liveShares = shares(liveRevenues);
  const livePre = hhi(liveRevenues);
  const livePost = hhiAfterMerger(liveRevenues, 0, 1);
  const liveDelta = livePost - livePre;

  // True ground truth market calculation
  const trueRevenues = useMemo(
    () => [
      ...currentCase.core.map((c) => c.revenue),
      ...currentCase.candidates.filter((c) => c.belongs).flatMap((c) => c.firms),
    ],
    [currentCase]
  );
  const truePre = hhi(trueRevenues);
  const truePost = hhiAfterMerger(trueRevenues, 0, 1);
  const trueDelta = truePost - truePre;
  const trueVerdict = screenMerger(truePost, trueDelta);

  const marketCorrect = currentCase.candidates.every(
    (c) => c.belongs === included.includes(c.id)
  );

  const start = () => {
    setPhase("define");
    startMusic("game");
  };

  function checkDefinition() {
    if (defineChecked) return;
    currentCase.candidates.forEach((c) => {
      const ok = c.belongs === included.includes(c.id);
      recordAttempt("game-theory", ok ? "correct" : "incorrect");
      if (ok) setScore((s) => s + 1);
    });
    playSfx(marketCorrect ? "correct" : "wrong");
    setDefineChecked(true);
  }

  function checkDelta() {
    if (deltaChecked) return;
    const g = Number(deltaInput);
    const ok =
      deltaInput.trim() !== "" &&
      Math.abs(g - trueDelta) <= currentCase.deltaTolerance;
    recordAttempt("combinatorics", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 3);
    setDeltaChecked(true);
  }

  function checkVerdict() {
    if (verdictChecked || verdictPick === null) return;
    const ok = verdictPick === trueVerdict;
    recordAttempt("logic-puzzles", ok ? "correct" : "incorrect");
    playSfx(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 2);
    setVerdictChecked(true);
  }

  // Prevent server/client hydration mismatch by hiding UI until random case is ready
  if (!isMounted) return null;

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      {phase === "brief" && (
        // Deliberately says nothing about which case you're about to get.
        // The brief used to print the case title, premise, its specific
        // substitute threshold and its interview note — so you'd already
        // read the whole setup before deciding to spend a round on it, and
        // the "random case" was random in name only. Everything here is now
        // the method, which is identical for every case; the file itself
        // opens on click.
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">Merger review</p>
          <p>
            A merger lands on your desk. Decide what counts as the market, run the concentration
            math on it, and say whether the agency should clear it or challenge it.
          </p>
          <div className="lab-topic-grid">
            {[
              ["HHI", "sum of squared shares"],
              ["ΔHHI", "2 × s₁ × s₂"],
              ["CROSS-ELASTICITY", "substitutes join the market"],
              ["THRESHOLDS", "1500, 2500 & Δ200"],
            ].map(([t, s]) => (
              <div key={t}>
                <strong>{t}</strong>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <p className="mm-step-hint">
            <strong>Interview lens:</strong> Market definition dictates the math. Establish
            cross-elasticity before running HHI — the same merger clears or fails depending on
            where you draw the boundary.
          </p>
          <AccessStartButton
            gameId="econ-antitrust"
            title="The Antitrust Simulator"
            defaultLabel="Open a case file"
            className="continue-btn"
            onStart={start}
          >
            Open a case file
          </AccessStartButton>
        </div>
      )}

      {phase !== "brief" && (
        <>
          <div className="lab-hud">
            <span>
              PHASE{" "}
              <strong>
                {phase === "define" ? "1/3" : phase === "compute" ? "2/3" : "3/3"}
              </strong>
            </span>
            <span>
              SCORE <strong>{score}</strong>
            </span>
            <span>
              MARKET{" "}
              <strong>
                {currentCase.unit}
                {liveRevenues.reduce((a, b) => a + b, 0).toLocaleString()}
              </strong>
            </span>
          </div>

          {/* Core market list */}
          <div className="hhi-firms">
            <p className="did-trends-title">{currentCase.title} — Primary Market</p>
            {currentCase.core.map((f, i) => (
              <div
                className={f.merging ? "hhi-firm is-merging" : "hhi-firm"}
                key={f.id}
              >
                <span>
                  {f.name}
                  {f.merging && <em> merging</em>}
                </span>
                <strong>
                  {currentCase.unit}
                  {f.revenue}
                </strong>
                <b>{liveShares[i].toFixed(1)}%</b>
              </div>
            ))}
          </div>

          {/* Phase 1 */}
          {phase === "define" && (
            <div className="stochastic-explain">
              <p className="quiz-panel-title">Step 1 — Define the Relevant Market</p>
              <p className="mm-step-hint">
                Include a candidate segment only if customers switch when core prices rise
                by 5%. Cross-price elasticity &gt;= <strong>{currentCase.substituteThreshold.toFixed(1)}</strong> counts.
              </p>

              <div className="conf-list">
                {currentCase.candidates.map((c) => {
                  const on = included.includes(c.id);
                  const right = c.belongs === on;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      disabled={defineChecked}
                      className={
                        defineChecked
                          ? right
                            ? "conf-card is-answer"
                            : "conf-card is-wrong"
                          : on
                          ? "conf-card is-on"
                          : "conf-card"
                      }
                      onClick={() => toggle(c.id)}
                    >
                      <strong>
                        {on ? "▣ IN MARKET" : "☐ EXCLUDED"} — {c.name}
                      </strong>
                      <span>{c.detail}</span>
                      <span className="hhi-elast">
                        {currentCase.unit}
                        {c.firms.reduce((a, b) => a + b, 0)} across {c.firms.length} firms · cross-elasticity{" "}
                        <b
                          className={
                            c.crossElasticity >= currentCase.substituteThreshold
                              ? "is-hi"
                              : "is-lo"
                          }
                        >
                          {c.crossElasticity.toFixed(2)}
                        </b>
                      </span>
                      {defineChecked && (
                        <em>
                          {c.belongs ? "BELONGS — " : "DOES NOT BELONG — "}
                          {c.why}
                        </em>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="hhi-live">
                <span>
                  Market total{" "}
                  <strong>
                    {currentCase.unit}
                    {liveRevenues.reduce((a, b) => a + b, 0)}
                  </strong>
                </span>
                <span>
                  HHI now <strong>{livePre.toFixed(0)}</strong>
                </span>
                <span>
                  ΔHHI if merged <strong>{liveDelta.toFixed(0)}</strong>
                </span>
              </div>

              {!defineChecked ? (
                <button
                  type="button"
                  className="calc-submit-btn"
                  onClick={checkDefinition}
                >
                  Lock Market Definition
                </button>
              ) : (
                <>
                  <p
                    className={
                      marketCorrect
                        ? "quiz-q-explain is-correct"
                        : "quiz-q-explain is-wrong"
                    }
                  >
                    {marketCorrect
                      ? currentCase.correctExplanation
                      : currentCase.wrongExplanation}
                  </p>
                  <button
                    type="button"
                    className="continue-btn"
                    onClick={() => setPhase("compute")}
                  >
                    Run the numbers →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Phase 2 */}
          {phase === "compute" && (
            <div className="stochastic-explain">
              <p className="quiz-panel-title">Step 2 — Concentration Increase (ΔHHI)</p>
              <p className="mm-step-hint">
                Under the verified market, {currentCase.core[0].name} holds{" "}
                <strong>{shares(trueRevenues)[0].toFixed(2)}%</strong> and {currentCase.core[1].name} holds{" "}
                <strong>{shares(trueRevenues)[1].toFixed(2)}%</strong>.
              </p>
              <div className="mutiny-formula">ΔHHI = 2 × s₁ × s₂</div>

              <div className="calc-input-row">
                <input
                  type="text"
                  className="calc-input"
                  inputMode="decimal"
                  value={deltaInput}
                  disabled={deltaChecked}
                  placeholder="Increase in HHI points"
                  onChange={(e) => setDeltaInput(e.target.value)}
                />
                {!deltaChecked && (
                  <button
                    type="button"
                    className="calc-submit-btn"
                    onClick={checkDelta}
                  >
                    Check
                  </button>
                )}
              </div>

              {deltaChecked && (
                <>
                  <p
                    className={
                      Math.abs(Number(deltaInput) - trueDelta) <= currentCase.deltaTolerance
                        ? "quiz-q-explain is-correct"
                        : "quiz-q-explain is-wrong"
                    }
                  >
                    ΔHHI = 2 × {shares(trueRevenues)[0].toFixed(2)} ×{" "}
                    {shares(trueRevenues)[1].toFixed(2)} ={" "}
                    <strong>{trueDelta.toFixed(0)}</strong> points. HHI moves from{" "}
                    {truePre.toFixed(0)} ({concentrationBand(truePre)}) to{" "}
                    {truePost.toFixed(0)} ({concentrationBand(truePost)}).
                  </p>
                  <button
                    type="button"
                    className="continue-btn"
                    onClick={() => setPhase("verdict")}
                  >
                    File recommendation →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Phase 3 */}
          {phase === "verdict" && (
            <div className="stochastic-explain">
              <p className="quiz-panel-title">Step 3 — Regulatory Recommendation</p>
              <div className="hhi-thresholds">
                <span>Unconcentrated: &lt; 1500</span>
                <span>Moderately Concentrated: 1500–2500</span>
                <span>Highly Concentrated: &gt; 2500</span>
                <span>Δ &gt; 200 in a highly concentrated market is presumed anticompetitive</span>
              </div>

              <div className="calc-choice-grid">
                {(Object.keys(VERDICT_COPY) as (keyof typeof VERDICT_COPY)[]).map(
                  (v) => (
                    <button
                      type="button"
                      key={v}
                      disabled={verdictChecked}
                      className={
                        verdictChecked
                          ? v === trueVerdict
                            ? "calc-choice is-answer"
                            : v === verdictPick
                            ? "calc-choice is-selected"
                            : "calc-choice"
                          : verdictPick === v
                          ? "calc-choice is-selected"
                          : "calc-choice"
                      }
                      onClick={() => setVerdictPick(v)}
                    >
                      {VERDICT_COPY[v]}
                    </button>
                  )
                )}
              </div>

              {!verdictChecked ? (
                <button
                  type="button"
                  className="calc-submit-btn"
                  disabled={verdictPick === null}
                  onClick={checkVerdict}
                >
                  File Verdict
                </button>
              ) : (
                <>
                  <p
                    className={
                      verdictPick === trueVerdict
                        ? "quiz-q-explain is-correct"
                        : "quiz-q-explain is-wrong"
                    }
                  >
                    {currentCase.verdictNarrative}
                  </p>
                  <button
                    type="button"
                    className="continue-btn"
                    onClick={loadRandomCase}
                  >
                    Next Scenario
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

