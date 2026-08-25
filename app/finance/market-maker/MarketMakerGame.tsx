"use client";

import { useState } from "react";
import GameLeaderboard from "../../scores/GameLeaderboard";
import {
  flattenCost,
  generateRoundTruth,
  markToMarket,
  resolveQuote,
  type RoundTruth,
} from "./marketMakerMath";
import { GAMMA, KAPPA, SIGMA, computeQuote } from "./avellanedaStoikovMath";
import { pickMMQuestion, type MMQuestionInstance } from "./marketMakerQuestions";
import { ResultBanner } from "../../probability/quitters-never-lose/lottery/pick/PixelArt";
import MarketMakerIntro from "./MarketMakerIntro";
import { AccessStartButton } from "../../access/TokenPlayButton";

const STARTING_BANKROLL = 100;
const STAKE_OPTIONS = [5, 10, 20, 50]; // dollars per tick of P&L
const ROUNDS = 10;
const START_FAIR = 100;
const STEP_DELAY = 1400;
const R_TOLERANCE = 0.15; // ticks — how close a typed reservation-price guess must be

function fmt2(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmt(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtTicks(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function parseAnswer(input: string): number | null {
  const trimmed = input.trim().replace(/^\$/, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

type Round = { truth: RoundTruth; filled: boolean; informed: boolean; side: "buy" | "sell" | null };
type Phase = "tutorial" | "setup" | "quoting" | "question" | "resolving" | "resolved";

// Always-available plain-English reference. The tutorial teaches these once;
// this keeps them one tap away instead of forcing a replay to remember what
// "skew" meant.
function GlossaryHud() {
  const [open, setOpen] = useState(false);
  return (
    <div className="hilo-hud">
      <button type="button" className="hilo-hud-toggle" onClick={() => setOpen((o) => !o)}>
        What do these mean?
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="hilo-hud-body">
          <p className="hilo-hud-section-title">GLOSSARY</p>
          <p className="mm-gloss-row">
            <strong>Tick</strong> — smallest price step (think: one cent).
          </p>
          <p className="mm-gloss-row">
            <strong>Fair</strong> — what it's actually worth right now.
          </p>
          <p className="mm-gloss-row">
            <strong>Your bid</strong> — the price you'll BUY at (below fair).
          </p>
          <p className="mm-gloss-row">
            <strong>Your ask</strong> — the price you'll SELL at (above fair).
          </p>
          <p className="mm-gloss-row">
            <strong>Half-spread</strong> — how far each side sits from fair. Wider = more profit per trade, fewer trades.
          </p>
          <p className="mm-gloss-row">
            <strong>Skew</strong> — slides BOTH prices up/down together without changing the gap.
          </p>
          <p className="mm-gloss-row">
            <strong>Inventory</strong> — what you're left holding. +1 long, −1 short. Costs you to clear at the end.
          </p>
          <p className="mm-gloss-row">
            <strong>Informed flow</strong> — a counterparty who already knows the price is about to move against you.
          </p>
          <p className="mm-gloss-row">
            <strong>Reservation price (r)</strong> — the price you'd be indifferent to buying or selling at, given the
            inventory you're carrying. Flat inventory: r = fair. Long: r drops below fair. Short: r rises above fair.
          </p>
          <p className="mm-gloss-row">
            <strong>Risk aversion (γ)</strong> — how much inventory risk bothers you. Higher γ skews r harder and widens
            your spread.
          </p>
          <p className="mm-gloss-row">
            <strong>Volatility (σ)</strong> — how much fair value jumps around per round. Higher σ means inventory is
            riskier to hold, so it also widens spread and skew.
          </p>
          <p className="mm-gloss-row">
            <strong>Time-to-horizon (T−t)</strong> — how much of the session is left. Skew and spread both shrink as it
            runs down — less time for inventory risk to bite.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MarketMakerGame() {
  const [phase, setPhase] = useState<Phase>("tutorial");

  const [stake, setStake] = useState<number | null>(null);

  const [fair, setFair] = useState(START_FAIR);
  const [cash, setCash] = useState(0);
  const [inventory, setInventory] = useState(0);
  const [round, setRound] = useState(0);
  const [truth, setTruth] = useState<RoundTruth | null>(null);
  const [half, setHalf] = useState<number | null>(null);
  const [skew, setSkew] = useState<number | null>(null);
  const [history, setHistory] = useState<Round[]>([]);

  const [question, setQuestion] = useState<MMQuestionInstance | null>(null);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);

  const [rAnswer, setRAnswer] = useState("");
  const [rChecked, setRChecked] = useState(false);

  const [statusMsg, setStatusMsg] = useState("");
  const [finalCash, setFinalCash] = useState<number | null>(null);
  const [flattenCostPaid, setFlattenCostPaid] = useState(0);

  const startRound = (r: number) => {
    setRound(r);
    setTruth(generateRoundTruth());
    setHalf(null);
    setSkew(null);
    setQuestion(null);
    setAnswer("");
    setChecked(false);
    setRAnswer("");
    setRChecked(false);
    setPhase("quoting");
  };

  const startGame = () => {
    if (stake === null) return;
    setFair(START_FAIR);
    setCash(0);
    setInventory(0);
    setHistory([]);
    setFinalCash(null);
    startRound(0);
  };

  const asQuote = truth ? computeQuote(fair, inventory, round, ROUNDS) : null;

  const checkReservation = () => setRChecked(true);
  const rGuess = parseAnswer(rAnswer);
  const rCorrect = rChecked && !!asQuote && rGuess !== null && Math.abs(rGuess - asQuote.r) <= R_TOLERANCE;

  const confirmReservation = () => {
    if (!asQuote) return;
    // Round to cents before it becomes game state — the raw float is exact
    // enough to be ugly in every downstream prompt/display (long repeating
    // decimals), and two decimal places is already finer than any of this
    // game's other displayed quantities.
    setHalf(Math.round(asQuote.half * 100) / 100);
    setSkew(Math.round(asQuote.skew * 100) / 100);
    setQuestion(pickMMQuestion(question?.id));
    setAnswer("");
    setChecked(false);
    setPhase("question");
  };

  const checkQuestion = () => setChecked(true);

  const quoteIt = () => {
    if (half === null || skew === null || !truth) return;
    setPhase("resolving");
    setStatusMsg("Waiting for a counterparty...");
    window.setTimeout(() => {
      const result = resolveQuote(half, skew, fair, truth);
      const nextCash = cash + result.cashDelta;
      const nextInventory = inventory + result.inventoryDelta;
      const nextFair = fair + truth.move;
      setCash(nextCash);
      setInventory(nextInventory);
      setFair(nextFair);
      setHistory((h) => [...h, { truth, filled: result.filled, informed: truth.informed, side: result.side }]);

      if (!result.filled) {
        setStatusMsg(`No fill. This round's flow was ${truth.informed ? "informed" : "noise"} — price moved ${fmtTicks(truth.move)}.`);
      } else {
        setStatusMsg(
          `Filled — ${result.side === "buy" ? "they lifted your ask" : "they hit your bid"}. That flow was ${
            truth.informed ? "informed" : "noise"
          }, price moved ${fmtTicks(truth.move)}.`
        );
      }

      window.setTimeout(() => {
        setStatusMsg("");
        const nextRound = round + 1;
        if (nextRound >= ROUNDS) {
          settle(nextCash, nextInventory, nextFair);
        } else {
          startRound(nextRound);
        }
      }, STEP_DELAY);
    }, 900);
  };

  const settle = (c: number, inv: number, f: number) => {
    const cost = flattenCost(inv);
    const closed = c + inv * f - cost;
    setCash(closed);
    setInventory(0);
    setFinalCash(closed);
    setFlattenCostPaid(cost);
    setPhase("resolved");
  };

  const flattenAndCashOut = () => {
    settle(cash, inventory, fair);
  };

  const playAgain = () => {
    setPhase("setup");
    setStake(null);
  };

  const ctx = truth && half !== null && skew !== null ? { half, skew, fair, inventory, signal: truth.signal } : null;
  const answerCheck = question && ctx ? question.answer(ctx) : null;
  const isCorrect =
    checked &&
    !!answerCheck &&
    (question!.choices
      ? answer === answerCheck.display
      : (() => {
          const p = parseAnswer(answer);
          return p !== null && Math.abs(p - answerCheck.decimal) <= answerCheck.tolerance;
        })());

  const liveMtm = markToMarket(cash, inventory, fair);
  const totalPnl = finalCash ?? liveMtm; // cash starts at 0, so mark-to-market ticks *is* the P&L
  const pnlDollars = totalPnl * (stake ?? 0);
  const bankroll = STARTING_BANKROLL + pnlDollars;

  if (phase === "tutorial") {
    return <MarketMakerIntro onDone={() => setPhase("setup")} />;
  }

  return (
    <div className="answer-content">
      <GlossaryHud />

      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">Market Maker</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        {ROUNDS} rounds. Each round you post two prices, someone trades against one of them, and the price moves. Stuck on
        a word? Open <em>What do these mean?</em> in the corner.
      </p>

      {phase === "setup" && (
        <div className="pixel-stage">
          <p className="quiz-panel-title" style={{ marginBottom: 12 }}>
            Bankroll: {fmt(STARTING_BANKROLL)}
          </p>
          <p className="pick-ticket-col-label" style={{ marginBottom: 6 }}>
            STAKE PER TICK
          </p>
          <div className="answer-crew-picker" style={{ marginBottom: 18 }}>
            {STAKE_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={stake === s ? "chip-btn active" : "chip-btn"}
                onClick={() => setStake(s)}
              >
                {fmt(s)}/tick
              </button>
            ))}
          </div>
          <AccessStartButton gameId="finance-market-maker" title="Market Maker" defaultLabel="Start" className="continue-btn" disabled={stake === null} onStart={startGame}>
            Start
          </AccessStartButton>
        </div>
      )}

      {phase !== "setup" && phase !== "resolved" && (
        <div className="pixel-stage">
          <div className="answer-crew-picker" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <span className="qty-hint">Round {Math.min(round + 1, ROUNDS)} / {ROUNDS}</span>
            <span className="qty-hint">P&amp;L: {fmt(pnlDollars)}</span>
          </div>

          <div className="mm-price-row">
            <div className="mm-price-tile">
              <span className="mm-price-label">FAIR</span>
              <span className="mm-price-value">{fair}</span>
            </div>
            <div className="mm-price-tile">
              <span className="mm-price-label">YOU BUY AT</span>
              <span className="mm-price-value is-good">{half !== null && skew !== null ? fmt2(fair - half + skew) : "—"}</span>
            </div>
            <div className="mm-price-tile">
              <span className="mm-price-label">YOU SELL AT</span>
              <span className="mm-price-value is-bad">{half !== null && skew !== null ? fmt2(fair + half + skew) : "—"}</span>
            </div>
            <div className="mm-price-tile">
              <span className="mm-price-label">INVENTORY</span>
              <span
                className={
                  inventory === 0 ? "mm-price-value" : inventory > 0 ? "mm-price-value is-good" : "mm-price-value is-bad"
                }
              >
                {inventory >= 0 ? "+" : ""}
                {inventory}
              </span>
            </div>
          </div>

          {history.length > 0 && (
            <div className="mm-round-track">
              {history.map((h, i) => (
                <span
                  key={i}
                  className={!h.filled ? "mm-round-dot is-nofill" : h.informed ? "mm-round-dot is-informed" : "mm-round-dot is-noise"}
                  title={!h.filled ? "No fill" : h.informed ? "Informed fill" : "Noise fill"}
                />
              ))}
            </div>
          )}

          {(phase === "quoting" || phase === "question") && truth && (
            <p
              className={
                truth.signal === "buy" ? "mm-signal-badge is-buy" : truth.signal === "sell" ? "mm-signal-badge is-sell" : "mm-signal-badge is-quiet"
              }
            >
              {truth.signal
                ? `TIP: informed ${truth.signal === "buy" ? "BUYING" : "SELLING"} may be coming — price likely to move ${
                    truth.signal === "buy" ? "UP" : "DOWN"
                  }`
                : "TIP: no read on the flow this round"}
            </p>
          )}

          {phase === "quoting" && asQuote && (
            <div className="quiz-panel" style={{ marginTop: 10 }}>
              <p className="quiz-panel-title">Compute your reservation price</p>
              <div className={rChecked ? (rCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                <p className="quiz-q-topic">Avellaneda–Stoikov</p>
                <p className="quiz-q-prompt">
                  r = fair − q·γ·σ²·(T−t). Fair = {fair}, inventory q = {inventory >= 0 ? "+" : ""}
                  {inventory}, γ = {GAMMA}, σ = {SIGMA}, round {round + 1}/{ROUNDS} (T−t = {(1 - round / ROUNDS).toFixed(2)}).
                  What's r?
                </p>
                <div className="quiz-q-input-row">
                  <input
                    type="text"
                    className="quiz-q-input"
                    placeholder="type your answer"
                    value={rAnswer}
                    onChange={(e) => setRAnswer(e.target.value)}
                    disabled={rChecked}
                  />
                </div>
                {!rChecked && (
                  <button type="button" className="chip-btn" disabled={!rAnswer} onClick={checkReservation} style={{ marginTop: 10 }}>
                    Check
                  </button>
                )}
                {rChecked && (
                  <p className={rCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                    {rCorrect ? "✓ Correct. " : `✗ Not quite — it's ${fmt2(asQuote.r)}. `}
                    Optimal spread δ = γσ²(T−t) + (2/γ)ln(1+γ/κ) = {fmt2(asQuote.spread)} ticks (κ = {KAPPA}), so bid ={" "}
                    {fmt2(asQuote.bid)}, ask = {fmt2(asQuote.ask)}.{" "}
                    {inventory > 0
                      ? "You're long, so r sits below fair — you're keener to sell than buy."
                      : inventory < 0
                        ? "You're short, so r sits above fair — you're keener to buy than sell."
                        : "Flat inventory, so r sits right at fair — no lean either way."}
                  </p>
                )}
              </div>

              {rChecked && (
                <button type="button" className="continue-btn" style={{ marginTop: 10 }} onClick={confirmReservation}>
                  Post the quote
                </button>
              )}

              {round > 0 && !rChecked && (
                <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={flattenAndCashOut}>
                  Flatten &amp; cash out
                </button>
              )}
            </div>
          )}

          {phase === "question" && question && ctx && (
            <div className="quiz-panel" style={{ marginTop: 10 }}>
              <p className="quiz-panel-title">Before the round resolves...</p>
              <div className={checked ? (isCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                <p className="quiz-q-topic">{question.topicLabel}</p>
                <p className="quiz-q-prompt">{question.prompt(ctx)}</p>

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
                    {question.explanation(ctx)}
                  </p>
                )}
              </div>

              {checked && (
                <button type="button" className="continue-btn" style={{ marginTop: 10 }} onClick={quoteIt}>
                  Send the quote
                </button>
              )}
            </div>
          )}

          {phase === "resolving" && <p className="qty-hint">{statusMsg}</p>}
        </div>
      )}

      {phase === "resolved" && (
        <div className="pixel-stage">
          <ResultBanner
            outcome={pnlDollars >= 0 ? "win" : "loss"}
            title={pnlDollars >= 0 ? "SESSION PROFIT" : "SESSION LOSS"}
            sub={`${fmt(pnlDollars)} over ${Math.min(round + 1, ROUNDS)} rounds (incl. ${fmt(
              flattenCostPaid * (stake ?? 0)
            )} flatten cost) — ended at ${fmt(bankroll)}`}
          />
          {/* Profit, not final bankroll — same reasoning as Ruin Walker. */}
          <GameLeaderboard
            gameId="finance-market-maker"
            score={Math.round(pnlDollars)}
            title="Market Maker leaderboard"
          />
          <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={playAgain}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
