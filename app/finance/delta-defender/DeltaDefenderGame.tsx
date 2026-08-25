"use client";

import { useEffect, useRef, useState } from "react";
import { ResultBanner } from "../../probability/quitters-never-lose/lottery/pick/PixelArt";
import {
  GAME,
  analyzeHedgeResults,
  generatePricePath,
  randomScenario,
  type HedgeTickAnalysis,
  type PathPoint,
  type Scenario,
} from "./deltaMath";
import { runHedgeAlgorithm, type HedgeRunResult } from "./runHedgeCode";
import "./delta.css";

type Phase = "briefing" | "coding" | "running" | "playback" | "done";

const STARTER_CODE = `function hedgeRatio(S, K, T, r, sigma, tick) {
  // Return the fraction of a share to hold per option (0 to 1).
  // You get the live stock price S, strike K, years-to-expiry T,
  // risk-free rate r, volatility sigma, and the tick index (1-based).
  // A good starting idea: recompute Black-Scholes delta yourself.

  return 0.5;
}`;

const REFERENCE_CODE = `function hedgeRatio(S, K, T, r, sigma, tick) {
  function normCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) p = 1 - p;
    return p;
  }
  if (T <= 0) return S > K ? 1 : 0;
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  return normCDF(d1);
}`;

export default function DeltaDefenderGame() {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [code, setCode] = useState(STARTER_CODE);
  const [showReference, setShowReference] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [path, setPath] = useState<PathPoint[]>([]);
  const [analysis, setAnalysis] = useState<{ ticks: HedgeTickAnalysis[]; hedgedFraction: number; avgAbsNetDelta: number; validCount: number } | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const playbackTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  function startBriefing() {
    setPhase("coding");
  }

  async function runSimulation() {
    setPhase("running");
    setRunError(null);
    // A fresh scenario (strike/expiry/vol) AND a fresh price path every run —
    // a hard-coded number, or a formula tuned to one specific setup, won't
    // survive the next click.
    const newScenario = randomScenario();
    const newPath = generatePricePath(newScenario);
    const result: HedgeRunResult = await runHedgeAlgorithm(
      code,
      newPath.map((p) => ({ tick: p.tick, S: p.S, T: p.T, r: p.r, sigma: p.sigma, K: p.K }))
    );
    if (result.crashed) {
      setRunError(result.crashMessage ?? "Something went wrong running your code.");
      setPhase("coding");
      return;
    }
    const analyzed = analyzeHedgeResults(newPath, result.results);
    setScenario(newScenario);
    setPath(newPath);
    setAnalysis(analyzed);
    setPlaybackIndex(0);
    setPhase("playback");
  }

  useEffect(() => {
    if (phase !== "playback" || !analysis) return;
    const id = setInterval(() => {
      setPlaybackIndex((i) => {
        if (i + 1 >= analysis.ticks.length) {
          clearInterval(id);
          setTimeout(() => setPhase("done"), 400);
          return i;
        }
        return i + 1;
      });
    }, GAME.TICK_MS);
    playbackTimer.current = id;
    return () => clearInterval(id);
  }, [phase, analysis]);

  function skipToEnd() {
    if (playbackTimer.current) clearInterval(playbackTimer.current);
    setPhase("done");
  }

  function tryAgain() {
    setPhase("coding");
    setPath([]);
    setAnalysis(null);
    setPlaybackIndex(0);
  }

  // ---------- Briefing ----------
  if (phase === "briefing") {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Finance // Options &amp; Greeks</p>
        <h1 className="pirate-story-line answer-title">Delta Defender</h1>
        <div className="pixel-stage delta-briefing">
          <p className="quiz-panel-title">Write the hedging rule. We'll run it for you.</p>
          <p>
            You're short one call. Instead of dragging a slider, you write a <code>hedgeRatio(S, K, T, r, sigma, tick)</code>{" "}
            function. Every run, we pick a fresh strike, expiry, and volatility, generate a real GBM price path, and call
            your function at every one of {GAME.TOTAL_TICKS} ticks - then the needle plays back exactly how well your
            formula tracked true Delta the whole way through.
          </p>
          <div className="delta-rule-grid">
            <div><strong>YOU WRITE</strong><span>hedgeRatio(...)</span><small>a function of S, K, T, r, sigma, tick</small></div>
            <div><strong>WE RANDOMIZE</strong><span>every run</span><small>strike, expiry, vol, and price path all change</small></div>
            <div><strong>YOU SEE</strong><span>the fit</span><small>needle plays back your net delta over time</small></div>
          </div>
          <p className="mm-step-hint">
            Interview lens: this is the actual question - "write me a delta-hedging rule" - not a guessing game about
            one. A formula that only works for one strike or one expiry will get caught out on the next run.
          </p>
          <button type="button" className="continue-btn" onClick={startBriefing}>Open the editor</button>
        </div>
      </div>
    );
  }

  // ---------- Coding ----------
  if (phase === "coding" || phase === "running") {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Finance // Write the rule</p>
        <h1 className="pirate-story-line answer-title">Delta Defender</h1>
        <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 12 }}>
          Return a hedge ratio (0 to 1) from <code>hedgeRatio(S, K, T, r, sigma, tick)</code>. It'll be called once per
          tick against a real simulated price path.
        </p>

        <textarea
          className="algo-code-editor delta-code-editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          rows={12}
          disabled={phase === "running"}
        />

        <div className="algo-mini-actions">
          <button type="button" className="calc-submit-btn" onClick={runSimulation} disabled={phase === "running"}>
            {phase === "running" ? "Running…" : "Run simulation"}
          </button>
          <button type="button" className="chip-btn" onClick={() => setShowReference((s) => !s)}>
            {showReference ? "Hide reference" : "Reveal reference"}
          </button>
        </div>

        {showReference && <pre className="lab-code algo-mini-code">{REFERENCE_CODE}</pre>}

        {runError && (
          <p className="quiz-q-explain is-wrong">
            Crashed: {runError}
          </p>
        )}
      </div>
    );
  }

  // ---------- Playback ----------
  if (phase === "playback" && analysis) {
    const current = analysis.ticks[playbackIndex];
    const netDelta = current.netDelta ?? 1;
    const isHedged = current.hedged;
    const isPanicking = Math.abs(netDelta) > GAME.NEUTRAL_TOLERANCE * 2;
    const hedgedSoFar = analysis.ticks.slice(0, playbackIndex + 1).filter((t) => t.hedged).length;

    return (
      <div className="answer-content">
        <p className="pirate-kicker">Finance // Playback</p>
        <h1 className="pirate-story-line answer-title">Delta Defender</h1>
        {scenario && (
          <p className="delta-progress-label" style={{ marginBottom: 12 }}>
            This run: {scenario.K}-strike call, {scenario.days}d to expiry, {Math.round(scenario.sigma * 100)}% vol.
          </p>
        )}

        <div className="delta-hud">
          <div className="mm-price-tile">
            <span>STOCK</span>
            <strong>${current.S.toFixed(2)}</strong>
          </div>
          <div className="mm-price-tile">
            <span>TICK</span>
            <strong>{current.tick}/{GAME.TOTAL_TICKS}</strong>
          </div>
          <div className="mm-price-tile">
            <span>HEDGED SO FAR</span>
            <strong>{hedgedSoFar}/{playbackIndex + 1}</strong>
          </div>
        </div>

        <div className={`delta-companion ${isPanicking ? "is-panicking" : isHedged ? "is-calm" : ""}`} aria-hidden="true">
          <div className="delta-seesaw-track">
            <div className="delta-seesaw-zone" />
            <div className="delta-seesaw-needle" style={{ left: `${50 + Math.max(-1, Math.min(1, netDelta)) * 45}%` }} />
          </div>
          <p className="delta-seesaw-label">
            Net Δ = {netDelta >= 0 ? "+" : ""}{netDelta.toFixed(3)} {isHedged ? "- flat" : isPanicking ? "- PANIC" : "- drifting"}
          </p>
        </div>

        <div className="delta-greeks-row">
          <div><span className="calc-comp-label">Your hedge</span><span className="calc-comp-val">{current.hedgeRatio?.toFixed(3) ?? "-"}</span></div>
          <div><span className="calc-comp-label">True Δ</span><span className="calc-comp-val is-good">{current.trueDelta.toFixed(3)}</span></div>
        </div>

        <button type="button" className="chip-btn" onClick={skipToEnd}>Skip to result</button>
      </div>
    );
  }

  // ---------- Done ----------
  if (phase === "done" && analysis) {
    const pctHedged = Math.round(analysis.hedgedFraction * 100);
    const won = analysis.hedgedFraction >= GAME.WIN_HEDGED_FRACTION;
    // Naive-benchmark context: a fixed 0.5 hedge on this exact path, for comparison.
    const naiveHedged = path.length
      ? path.filter((p) => Math.abs(0.5 - p.delta) <= GAME.NEUTRAL_TOLERANCE).length / path.length
      : 0;

    return (
      <div className="answer-content">
        <p className="pirate-kicker">Finance // Result</p>
        <h1 className="pirate-story-line answer-title">{won ? "Your rule held" : "Your rule drifted"}</h1>
        <ResultBanner
          outcome={won ? "win" : "loss"}
          title={won ? "DELTA DEFENDED" : "GAMMA GOT YOU"}
          sub={
            won
              ? `Your function stayed within tolerance on ${pctHedged}% of ticks - that's a real working hedging rule.`
              : `Your function only stayed within tolerance on ${pctHedged}% of ticks. Compare its shape to true Delta above and adjust.`
          }
        />
        <div className="delta-result-grid">
          <div><span>HEDGED TICKS</span><strong>{pctHedged}%</strong></div>
          <div><span>AVG |NET Δ|</span><strong>{analysis.avgAbsNetDelta.toFixed(3)}</strong></div>
          <div><span>STATIC-0.5 BENCHMARK</span><strong>{Math.round(naiveHedged * 100)}%</strong></div>
        </div>
        <p className="delta-progress-label">
          A trader who never adjusted from a flat 0.5 hedge would have stayed neutral on this exact path{" "}
          {Math.round(naiveHedged * 100)}% of the time - that's the bar a real rule needs to clear.
        </p>
        <div className="algo-mini-actions">
          <button type="button" className="continue-btn" onClick={tryAgain}>Rewrite &amp; run again</button>
        </div>
      </div>
    );
  }

  return null;
}
