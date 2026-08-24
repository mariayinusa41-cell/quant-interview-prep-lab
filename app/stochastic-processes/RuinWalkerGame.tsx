"use client";

import { useState } from "react";
import { ResultBanner } from "../probability/quitters-never-lose/lottery/pick/PixelArt";
import { AccessStartButton } from "../access/TokenPlayButton";
import {
  LAMBDA,
  MU,
  ROUNDS,
  START_SURPLUS,
  THETA_OPTIONS,
  adjustmentCoefficient,
  premiumRate,
  ruinProbability,
  simulateRound,
  type RoundOutcome,
} from "./cramerLundbergMath";

const STARTING_BANKROLL = 100;
const STAKE_OPTIONS = [1, 2, 5, 10]; // dollars per unit of surplus
const R_TOLERANCE = 0.02; // as a probability (2 percentage points)

type Phase = "briefing" | "setup" | "playing" | "question" | "resolving" | "ruined" | "cashed";

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmt2(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseAnswer(input: string): number | null {
  const trimmed = input.trim().replace(/%$/, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  // Accept either "36%" or "0.36" for a probability answer.
  return n > 1 ? n / 100 : n;
}

export default function RuinWalkerGame() {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [theta, setTheta] = useState<number | null>(null);
  const [stake, setStake] = useState<number | null>(null);

  const [surplus, setSurplus] = useState(START_SURPLUS);
  const [round, setRound] = useState(0);
  const [history, setHistory] = useState<RoundOutcome[]>([]);

  const [psiAnswer, setPsiAnswer] = useState("");
  const [psiChecked, setPsiChecked] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const start = () => setPhase("setup");

  const startGame = () => {
    if (theta === null || stake === null) return;
    setSurplus(START_SURPLUS);
    setRound(0);
    setHistory([]);
    setPsiAnswer("");
    setPsiChecked(false);
    setPhase("question");
  };

  const reset = () => {
    setPhase("briefing");
    setTheta(null);
    setStake(null);
  };

  const R = theta !== null ? adjustmentCoefficient(theta, MU) : 0;
  const premium = theta !== null ? premiumRate(theta, LAMBDA, MU) : 0;
  const truePsi = theta !== null ? ruinProbability(surplus, theta, MU) : 0;

  const checkPsi = () => setPsiChecked(true);
  const psiGuess = parseAnswer(psiAnswer);
  const psiCorrect = psiChecked && psiGuess !== null && Math.abs(psiGuess - truePsi) <= R_TOLERANCE;

  const playRound = () => {
    if (theta === null) return;
    setPhase("resolving");
    setStatusMsg("Rolling claims for the period...");
    window.setTimeout(() => {
      const outcome = simulateRound(surplus, theta, LAMBDA, MU);
      setLastOutcome(outcome);
      setHistory((h) => [...h, outcome]);

      const claimLine =
        outcome.claimCount === 0
          ? "No claims this period."
          : `${outcome.claimCount} claim${outcome.claimCount > 1 ? "s" : ""} totaling ${fmt2(outcome.totalClaims)} ticks.`;
      setStatusMsg(
        `Premium collected: ${fmt2(outcome.premium)}. ${claimLine} Surplus ${outcome.delta >= 0 ? "up" : "down"} ${fmt2(
          Math.abs(outcome.delta)
        )} → ${fmt2(Math.max(outcome.nextSurplus, 0))}.`
      );

      window.setTimeout(() => {
        setStatusMsg("");
        setSurplus(outcome.nextSurplus);
        const nextRound = round + 1;
        setRound(nextRound);

        if (outcome.ruined) {
          setPhase("ruined");
        } else if (nextRound >= ROUNDS) {
          setPhase("cashed");
        } else {
          setPsiAnswer("");
          setPsiChecked(false);
          setPhase("question");
        }
      }, 1600);
    }, 900);
  };

  const cashOutNow = () => setPhase("cashed");

  const netGain = surplus - START_SURPLUS;
  const pnlDollars = netGain * (stake ?? 0);
  const bankroll = STARTING_BANKROLL + pnlDollars;

  if (phase === "briefing") {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Stochastic Processes // Game 01</p>
        <h1 className="pirate-story-line answer-title">Ruin Walker</h1>
        <div className="pixel-stage stochastic-briefing">
          <p className="quiz-panel-title">You run the book. Don't go negative.</p>
          <p>
            This is the actual Cramér–Lundberg ruin model, not a coin-flip walk. Your surplus starts at {START_SURPLUS}{" "}
            ticks and earns premium every period — but claims arrive at random (Poisson rate λ = {LAMBDA}/period) with
            random sizes (mean μ = {MU} ticks). Ruin is surplus dropping below zero, permanently — there's no
            recovering once it happens.
          </p>
          <div className="stochastic-rule-grid">
            <div><strong>LOADING (θ)</strong><span>you choose</span><small>higher θ = fatter premium, safer, but you're charging more</small></div>
            <div><strong>CLAIMS</strong><span>random count &amp; size</span><small>Poisson arrivals, exponential severity</small></div>
            <div><strong>RUIN</strong><span>surplus &lt; 0</span><small>absorbing — game over</small></div>
          </div>
          <p className="mm-step-hint">
            Interview lens: the adjustment coefficient R and the ruin probability ψ(u) = (1/(1+θ))·e^(−Ru) are closed-form
            for exponential claims — you'll compute ψ(u) live each period as your surplus changes.
          </p>
          <AccessStartButton gameId="stochastic-ruin-walker" title="Ruin Walker" defaultLabel="Set up the book" className="continue-btn" onStart={start}>
            Set up the book
          </AccessStartButton>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Stochastic Processes // Game 01</p>
        <h1 className="pirate-story-line answer-title">Ruin Walker</h1>
        <div className="pixel-stage">
          <p className="quiz-panel-title" style={{ marginBottom: 12 }}>
            Bankroll: {fmt(STARTING_BANKROLL)}
          </p>
          <p className="pick-ticket-col-label" style={{ marginBottom: 6 }}>
            SAFETY LOADING (θ) — premium = (1+θ)·λ·μ per period
          </p>
          <div className="answer-crew-picker" style={{ marginBottom: 18 }}>
            {THETA_OPTIONS.map((t) => (
              <button key={t} type="button" className={theta === t ? "chip-btn active" : "chip-btn"} onClick={() => setTheta(t)}>
                θ = {Math.round(t * 100)}% → premium {fmt2(premiumRate(t, LAMBDA, MU))}/period
              </button>
            ))}
          </div>
          <p className="pick-ticket-col-label" style={{ marginBottom: 6 }}>
            STAKE PER UNIT SURPLUS
          </p>
          <div className="answer-crew-picker" style={{ marginBottom: 18 }}>
            {STAKE_OPTIONS.map((s) => (
              <button key={s} type="button" className={stake === s ? "chip-btn active" : "chip-btn"} onClick={() => setStake(s)}>
                {fmt(s)}/unit
              </button>
            ))}
          </div>
          <AccessStartButton
            gameId="stochastic-ruin-walker"
            title="Ruin Walker"
            defaultLabel="Start the book"
            className="continue-btn"
            disabled={theta === null || stake === null}
            onStart={startGame}
          >
            Start the book
          </AccessStartButton>
        </div>
      </div>
    );
  }

  if (phase === "ruined" || phase === "cashed") {
    const outcome = phase === "ruined";
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Stochastic Processes // Run complete</p>
        <h1 className="pirate-story-line answer-title">{outcome ? "Ruined" : "Book closed"}</h1>
        <ResultBanner
          outcome={outcome ? "loss" : pnlDollars >= 0 ? "win" : "loss"}
          title={outcome ? "SURPLUS WENT NEGATIVE" : pnlDollars >= 0 ? "SESSION PROFIT" : "SESSION LOSS"}
          sub={
            outcome
              ? `Ruin hit after ${round} period${round === 1 ? "" : "s"} at θ = ${Math.round((theta ?? 0) * 100)}%. Once surplus goes negative, the process is absorbed — there's no continuing.`
              : `${fmt(pnlDollars)} over ${round} periods — ended at ${fmt(bankroll)}, surplus ${fmt2(Math.max(surplus, 0))}.`
          }
        />

        <div className="pixel-stage stochastic-result-grid">
          <div><span>FINAL SURPLUS</span><strong>{fmt2(Math.max(surplus, 0))}</strong></div>
          <div><span>PERIODS</span><strong>{round}</strong></div>
          <div><span>LOADING θ</span><strong>{Math.round((theta ?? 0) * 100)}%</strong></div>
        </div>

        <div className="stochastic-explain">
          <p className="label">What the model says</p>
          <p>
            Adjustment coefficient R = θ/((1+θ)μ) = <strong>{R.toFixed(4)}</strong>. At θ = {Math.round((theta ?? 0) * 100)}%,
            starting from u = {START_SURPLUS} the exact ruin probability was ψ(u) = (1/(1+θ))·e^(−Ru) ={" "}
            <strong>{pct(ruinProbability(START_SURPLUS, theta ?? 0, MU))}</strong>.
          </p>
          <code>ψ(u) = (1/(1+θ)) · e^(−R·u)</code>
          <p>
            At u = 0 that formula gives exactly 1/(1+θ) = <strong>{pct(1 / (1 + (theta ?? 0)))}</strong> — however much
            you've saved up, there's always some ruin risk unless θ is charged high enough and u grows large.
          </p>
        </div>

        <AccessStartButton gameId="stochastic-ruin-walker" title="Ruin Walker" defaultLabel="Run it again" className="continue-btn" onStart={reset}>
          Run it again
        </AccessStartButton>
      </div>
    );
  }

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Stochastic Processes // Cramér–Lundberg live</p>
      <h1 className="pirate-story-line answer-title">Ruin Walker</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        {ROUNDS} periods. Premium accrues, claims land at random, and you watch the surplus. Surplus below zero ends
        the book.
      </p>

      <div className="pixel-stage">
        <div className="answer-crew-picker" style={{ justifyContent: "space-between", marginBottom: 6 }}>
          <span className="qty-hint">Period {Math.min(round + 1, ROUNDS)} / {ROUNDS}</span>
          <span className="qty-hint">P&amp;L: {fmt(pnlDollars)}</span>
        </div>

        <div className="mm-price-row">
          <div className="mm-price-tile">
            <span className="mm-price-label">SURPLUS</span>
            <span className="mm-price-value">{fmt2(Math.max(surplus, 0))}</span>
          </div>
          <div className="mm-price-tile">
            <span className="mm-price-label">LOADING θ</span>
            <span className="mm-price-value">{Math.round((theta ?? 0) * 100)}%</span>
          </div>
          <div className="mm-price-tile">
            <span className="mm-price-label">PREMIUM/PERIOD</span>
            <span className="mm-price-value is-good">{fmt2(premium)}</span>
          </div>
          <div className="mm-price-tile">
            <span className="mm-price-label">R</span>
            <span className="mm-price-value">{R.toFixed(4)}</span>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mm-round-track">
            {history.map((h, i) => (
              <span
                key={i}
                className={h.ruined ? "mm-round-dot is-nofill" : h.delta >= 0 ? "mm-round-dot is-noise" : "mm-round-dot is-informed"}
                title={h.ruined ? "Ruined" : h.claimCount === 0 ? "No claims" : `${h.claimCount} claim(s)`}
              />
            ))}
          </div>
        )}

        {phase === "question" && (
          <div className="quiz-panel" style={{ marginTop: 10 }}>
            <p className="quiz-panel-title">Compute the ruin probability</p>
            <div className={psiChecked ? (psiCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
              <p className="quiz-q-topic">Cramér–Lundberg</p>
              <p className="quiz-q-prompt">
                ψ(u) = (1/(1+θ))·e^(−R·u). Surplus u = {fmt2(surplus)}, θ = {Math.round((theta ?? 0) * 100)}%, R ={" "}
                {R.toFixed(4)}. What's ψ(u), the probability this book eventually gets ruined from here?
              </p>
              <div className="quiz-q-input-row">
                <input
                  type="text"
                  className="quiz-q-input"
                  placeholder="e.g. 36% or 0.36"
                  value={psiAnswer}
                  onChange={(e) => setPsiAnswer(e.target.value)}
                  disabled={psiChecked}
                />
              </div>
              {!psiChecked && (
                <button type="button" className="chip-btn" disabled={!psiAnswer} onClick={checkPsi} style={{ marginTop: 10 }}>
                  Check
                </button>
              )}
              {psiChecked && (
                <p className={psiCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                  {psiCorrect ? "✓ Correct. " : `✗ Not quite — it's ${pct(truePsi)}. `}
                  Higher surplus and higher loading both push ψ(u) down exponentially — that's the Lundberg bound at
                  work, not luck.
                </p>
              )}
            </div>

            {psiChecked && (
              <button type="button" className="continue-btn" style={{ marginTop: 10 }} onClick={playRound}>
                Run the period
              </button>
            )}

            {round > 0 && !psiChecked && (
              <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={cashOutNow}>
                Close the book &amp; cash out
              </button>
            )}
          </div>
        )}

        {phase === "resolving" && <p className="qty-hint">{statusMsg}</p>}
      </div>
    </div>
  );
}
