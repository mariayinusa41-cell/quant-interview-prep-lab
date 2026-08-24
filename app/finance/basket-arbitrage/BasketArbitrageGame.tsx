"use client";

import { useEffect, useState } from "react";
import type { LevelPuzzle, CommodityType } from "./basketTypes";
import { COMMODITY_NAMES } from "./basketTypes";
import { generateCampaign, calculateNetInventory, calculateLivePnL } from "./basketEngine";
import { CommodityIcon } from "./CommodityIcons";
import { AccessStartButton } from "../../access/TokenPlayButton";
import "../../drills/fermi/fermi.css";
import "./basketArbitrage.css";

type Phase = "tutorial" | "menu" | "playing" | "result";

// One fixed session clock across all 20 puzzles — the same "N questions in
// M minutes" shape as the Optiver-style assessment battery, not a per-
// puzzle timer. 24s/question on average, but early (small) puzzles leave
// slack for the later, harder ones.
const ROUND_COUNT = 20;
const SESSION_TIME_SEC = 8 * 60;

const TUTORIAL_STEPS = [
  "Each card is a tradeable basket of commodities with a bid (what you're paid to sell one) and an ask (what you pay to buy one).",
  "Buy and sell across the cards until every commodity's net inventory reads exactly zero — no directional risk, just the price gap.",
  `${ROUND_COUNT} rounds, one shared ${SESSION_TIME_SEC / 60}-minute clock for the whole set — it keeps running between rounds, so don't linger on the review screen. Execute once your position is fully hedged and cash-positive.`,
];

export default function BasketArbitrageGame() {
  const [phase, setPhase] = useState<Phase>("tutorial");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [campaign, setCampaign] = useState<LevelPuzzle[]>([]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [actions, setActions] = useState<Record<string, number>>({});
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIME_SEC);
  const [roundResult, setRoundResult] = useState<{ success: boolean; pnl: number; message: string } | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);

  const currentLevel = campaign[levelIndex] ?? null;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("basket-arb-best");
      if (stored) setBestScore(Number(stored));
    } catch { /* noop */ }
  }, []);

  // Per-round reset — no longer touches the clock, which runs for the
  // whole session independent of which round is showing.
  useEffect(() => {
    if (!currentLevel) return;
    setActions({});
    setRoundResult(null);
  }, [levelIndex, currentLevel]);

  // The one continuous session clock. Runs the whole time the player is in
  // "playing" phase, including while a round's result is being reviewed —
  // same as a real timed section, the clock doesn't pause for you to read.
  useEffect(() => {
    if (phase !== "playing") return;
    if (sessionTimeLeft <= 0) {
      endSession();
      return;
    }
    const id = setInterval(() => setSessionTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTimeLeft, phase]);

  function finishSession() {
    setTotalScore((finalScore) => {
      if (bestScore === null || finalScore > bestScore) {
        setBestScore(finalScore);
        try { localStorage.setItem("basket-arb-best", String(finalScore)); } catch { /* noop */ }
      }
      return finalScore;
    });
    setPhase("result");
  }

  function endSession() {
    if (!roundResult) handleExecute(true);
    finishSession();
  }

  function startCampaign() {
    const c = generateCampaign().slice(0, ROUND_COUNT);
    setCampaign(c);
    setLevelIndex(0);
    setTotalScore(0);
    setSessionTimeLeft(SESSION_TIME_SEC);
    setPhase("playing");
  }

  function updateQuantity(cardId: string, delta: number) {
    if (roundResult) return;
    setActions((prev) => {
      const current = prev[cardId] || 0;
      const next = Math.max(-3, Math.min(3, current + delta));
      return { ...prev, [cardId]: next };
    });
  }

  const inventory = currentLevel ? calculateNetInventory(currentLevel.cards, actions) : {};
  const livePnL = currentLevel ? calculateLivePnL(currentLevel.cards, actions) : 0;
  const isBalanced = Object.values(inventory).every((qty) => qty === 0);
  const hasOrders = Object.values(actions).some((qty) => qty !== 0);

  function handleExecute(timedOut = false) {
    if (!currentLevel) return;
    if (timedOut) {
      setRoundResult({ success: false, pnl: 0, message: "Time expired — order book closed without execution." });
      return;
    }
    if (!isBalanced) {
      setRoundResult({ success: false, pnl: livePnL, message: "Unhedged inventory — that's directional risk, not arbitrage." });
      return;
    }
    if (livePnL <= 0) {
      setRoundResult({ success: false, pnl: livePnL, message: "Zero or negative PnL — you crossed the spread at a loss." });
      return;
    }
    const points = Math.round(livePnL * 10 * (levelIndex + 1));
    setTotalScore((s) => s + points);
    setRoundResult({ success: true, pnl: livePnL, message: `Balanced and locked in +$${livePnL.toFixed(2)} with zero inventory risk.` });
  }

  function handleNextLevel() {
    if (levelIndex + 1 < campaign.length) {
      setLevelIndex((i) => i + 1);
      return;
    }
    finishSession();
  }

  // ---------- TUTORIAL ----------
  if (phase === "tutorial") {
    return (
      <div className="fermi-container basket-arb-container">
        <div className="fermi-menu">
          <h1 className="fermi-title">Basket Arbitrage</h1>
          <div className="dice-lab-tutorial-step">
            <p>{TUTORIAL_STEPS[tutorialStep]}</p>
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

  // ---------- MENU ----------
  if (phase === "menu") {
    return (
      <div className="fermi-container basket-arb-container">
        <div className="fermi-menu">
          <h1 className="fermi-title">Basket Arbitrage</h1>
          <p className="fermi-subtitle">
            {ROUND_COUNT} puzzles, {SESSION_TIME_SEC / 60} minutes on one shared clock — rising from 2 cards / 1
            commodity up to 9+ cards / 5 commodities. Find the hedge, balance the book, lock in the spread.
          </p>
          {bestScore !== null && <p className="fermi-best">Personal best: {bestScore} pts</p>}
          <AccessStartButton
            gameId="finance-basket-arbitrage"
            title="Basket Arbitrage"
            defaultLabel={`Start (${ROUND_COUNT} puzzles / ${SESSION_TIME_SEC / 60} min)`}
            className="fermi-start-btn"
            onStart={startCampaign}
          >
            Start ({ROUND_COUNT} puzzles / {SESSION_TIME_SEC / 60} min)
          </AccessStartButton>
        </div>
      </div>
    );
  }

  // ---------- RESULT ----------
  if (phase === "result") {
    return (
      <div className="fermi-container basket-arb-container">
        <div className="fermi-results">
          <h2 className="fermi-title">Campaign complete</h2>
          <div className="fermi-final-score">
            <span className="fermi-score-big">{totalScore}</span>
            <span className="fermi-score-of">pts</span>
          </div>
          <button type="button" className="fermi-start-btn" onClick={() => setPhase("menu")}>
            Play again
          </button>
        </div>
      </div>
    );
  }

  // ---------- PLAYING ----------
  if (!currentLevel) return null;
  return (
    <div className="fermi-container basket-arb-container">
      <div className="fermi-hud">
        <div className="fermi-hud-left">
          <span className="fermi-hud-q">Level {levelIndex + 1}/{campaign.length}</span>
          <span className="fermi-hud-cat">{currentLevel.title}</span>
        </div>
        <div className="fermi-hud-center">
          <span className={`fermi-timer ${sessionTimeLeft <= 30 ? "danger" : sessionTimeLeft <= 90 ? "warn" : ""}`}>
            {String(Math.floor(sessionTimeLeft / 60)).padStart(2, "0")}:{String(sessionTimeLeft % 60).padStart(2, "0")}
          </span>
        </div>
        <div className="fermi-hud-right">
          <span className="fermi-hud-score">{totalScore} pts</span>
        </div>
      </div>

      <p className="basket-arb-desc">{currentLevel.description}</p>

      <div className="basket-inv-bar">
        <span className="basket-inv-title">Live inventory:</span>
        <div className="basket-inv-pills">
          {(Object.keys(COMMODITY_NAMES) as CommodityType[])
            .filter((c) => currentLevel.cards.some((card) => card.composition[c] !== undefined))
            .map((c) => {
              const qty = inventory[c] ?? 0;
              return (
                <div key={c} className={`basket-inv-pill ${qty === 0 ? "zero" : qty > 0 ? "long" : "short"}`}>
                  <CommodityIcon commodity={c} className="basket-inv-icon" />
                  <strong>{qty > 0 ? `+${qty}` : qty}</strong>
                </div>
              );
            })}
        </div>
      </div>

      <div className="basket-cards-grid">
        {currentLevel.cards.map((card) => {
          const qty = actions[card.id] || 0;
          return (
            <div key={card.id} className={`basket-card ${qty > 0 ? "buying" : qty < 0 ? "selling" : ""}`}>
              <div className="basket-card-header">
                <span className="basket-card-name">{card.name}</span>
                <span className="basket-card-spread">Spread ${(card.ask - card.bid).toFixed(2)}</span>
              </div>

              <div className="basket-composition">
                {Object.entries(card.composition).map(([comm, count]) => (
                  <span key={comm} className="basket-comp-item">
                    <CommodityIcon commodity={comm as CommodityType} className="basket-comp-icon" />
                    {count}×
                  </span>
                ))}
              </div>

              <div className="basket-quotes">
                <div className="basket-quote-box bid">
                  <span className="basket-quote-lbl">BID · sell</span>
                  <span className="basket-quote-price">${card.bid.toFixed(2)}</span>
                </div>
                <div className="basket-quote-box ask">
                  <span className="basket-quote-lbl">ASK · buy</span>
                  <span className="basket-quote-price">${card.ask.toFixed(2)}</span>
                </div>
              </div>

              <div className="basket-qty-controls">
                <button
                  type="button"
                  className="basket-btn-qty sell"
                  onClick={() => updateQuantity(card.id, -1)}
                  disabled={!!roundResult || qty <= -3}
                >
                  − Sell
                </button>
                <span className={`basket-qty-val ${qty > 0 ? "pos" : qty < 0 ? "neg" : ""}`}>
                  {qty > 0 ? `+${qty} BUY` : qty < 0 ? `${qty} SELL` : "FLAT"}
                </span>
                <button
                  type="button"
                  className="basket-btn-qty buy"
                  onClick={() => updateQuantity(card.id, 1)}
                  disabled={!!roundResult || qty >= 3}
                >
                  + Buy
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="basket-exec-dock">
        <div className="basket-exec-pnl">
          <span>Net projected PnL:</span>
          <span className={livePnL > 0 ? "pos" : livePnL < 0 ? "neg" : ""}>
            {livePnL >= 0 ? `+$${livePnL.toFixed(2)}` : `−$${Math.abs(livePnL).toFixed(2)}`}
          </span>
        </div>
        {!roundResult ? (
          <button type="button" className="fermi-start-btn" onClick={() => handleExecute(false)} disabled={!hasOrders}>
            Execute
          </button>
        ) : (
          <button type="button" className="fermi-next-btn" onClick={handleNextLevel}>
            {levelIndex + 1 < campaign.length ? "Next level →" : "See final results"}
          </button>
        )}
      </div>

      {roundResult && (
        <div className="fermi-reveal" style={{ marginTop: "1.1rem" }}>
          <div className={`fermi-verdict pts-${roundResult.success ? 3 : 0}`}>
            <span className="fermi-verdict-label">{roundResult.message}</span>
          </div>
          <p className="fermi-explain">{currentLevel.explanation}</p>
        </div>
      )}
    </div>
  );
}
