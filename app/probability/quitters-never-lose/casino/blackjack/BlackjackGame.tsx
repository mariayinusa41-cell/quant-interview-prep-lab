"use client";

import { useEffect, useState } from "react";
import {
  bustProbability,
  buildShoe,
  handValue,
  payout,
  playerDoubleDown,
  playerHit,
  playerStand,
  startRound,
  type BlackjackRound,
  type Card,
  type Outcome,
} from "./blackjackMath";
import { resetCount, updateCount, type CountState } from "./hiLoMath";
import { ResultBanner } from "../../lottery/pick/PixelArt";
import BlackjackIntro from "./BlackjackIntro";

const STARTING_BANKROLL = 100;
const WAGER_OPTIONS = [5, 10, 20, 50];
const RESHUFFLE_BELOW = 52; // rebuild the shoe (and reset the count) once fewer than a deck's worth remain

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseAnswer(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function CardView({ card, hidden }: { card?: Card; hidden?: boolean }) {
  if (hidden || !card) {
    return <div className="bj-card bj-card-back" aria-label="Hidden card" />;
  }
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div className={isRed ? "bj-card bj-card-red" : "bj-card"}>
      <span className="bj-card-rank">{card.rank}</span>
      <span className="bj-card-suit">{card.suit}</span>
    </div>
  );
}

function outcomeCopy(outcome: Outcome | undefined, wager: number, won: number) {
  switch (outcome) {
    case "player-blackjack":
      return { kind: "win" as const, title: "BLACKJACK!", sub: `${fmt(won)} returned on a ${fmt(wager)} wager (3:2)` };
    case "player-win":
      return { kind: "win" as const, title: "YOU WIN", sub: `${fmt(won)} returned on a ${fmt(wager)} wager` };
    case "dealer-bust":
      return { kind: "win" as const, title: "DEALER BUSTS", sub: `${fmt(won)} returned on a ${fmt(wager)} wager` };
    case "push":
      return { kind: "loss" as const, title: "PUSH", sub: `Your ${fmt(wager)} wager is returned — no gain, no loss` };
    case "player-bust":
      return { kind: "loss" as const, title: "BUST", sub: `Lost your ${fmt(wager)} wager` };
    case "dealer-win":
      return { kind: "loss" as const, title: "DEALER WINS", sub: `Lost your ${fmt(wager)} wager` };
    default:
      return { kind: "loss" as const, title: "", sub: "" };
  }
}

// Pure reference, not a scoreboard — deliberately does NOT show the actual
// running/true count. If it did the math for you, the "quick check"
// question below would just be reading it off a screen instead of actually
// counting. This is a reminder of the RULE (what each card is worth), not
// the answer.
function HiLoHud() {
  const [open, setOpen] = useState(true);
  return (
    <div className="hilo-hud">
      <button type="button" className="hilo-hud-toggle" onClick={() => setOpen((o) => !o)}>
        Hi-Lo values
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="hilo-hud-body">
          <p className="hilo-hud-section-title">POINT VALUES</p>
          <div className="hilo-hud-ref-row">
            <span className="hilo-hud-ref-cards">2 – 6</span>
            <span className="hilo-hud-ref-value is-low">+1</span>
          </div>
          <div className="hilo-hud-ref-row">
            <span className="hilo-hud-ref-cards">7 – 9</span>
            <span className="hilo-hud-ref-value is-mid">0</span>
          </div>
          <div className="hilo-hud-ref-row">
            <span className="hilo-hud-ref-cards">10 – A</span>
            <span className="hilo-hud-ref-value is-high">−1</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlackjackGame() {
  const [introDone, setIntroDone] = useState(false);
  const [bankroll, setBankroll] = useState(STARTING_BANKROLL);
  const [wager, setWager] = useState<number | null>(null);
  const [round, setRound] = useState<BlackjackRound | null>(null);
  const [revealedDealerCount, setRevealedDealerCount] = useState(0);
  const [settledApplied, setSettledApplied] = useState(false);
  const [bustAnswer, setBustAnswer] = useState("");
  const [bustChecked, setBustChecked] = useState(false);

  // The shoe and the count both persist across hands — real card counting
  // only works if they do. They only reset together, on reshuffle.
  const [shoe, setShoe] = useState<Card[]>(() => buildShoe(4));
  const [count, setCount] = useState<CountState>(() => resetCount());
  const [countAnswer, setCountAnswer] = useState("");
  const [countChecked, setCountChecked] = useState(false);
  // Continuity markers so the carry-over is actually VISIBLE. Without these
  // the count silently persisted in state while the UI gave no sign of it,
  // which read as "the game resets every hand".
  const [handsThisShoe, setHandsThisShoe] = useState(0);
  const [justReshuffled, setJustReshuffled] = useState(false);
  const [countBeforeHand, setCountBeforeHand] = useState(0);

  // Reveal the dealer's hole card (and any dealer hits) one at a time once
  // the round settles, instead of dumping the whole resolved hand at once —
  // same self-chaining relative-timer pattern used for reveals elsewhere on
  // the site. The hole card (and any dealer hits) only join the count HERE,
  // the moment they're actually flipped face-up — a real count never
  // includes a card you haven't seen yet. Bankroll payout is applied
  // exactly once, when the reveal catches up to the fully-resolved hand.
  useEffect(() => {
    if (!round || round.phase !== "settled") return;
    if (revealedDealerCount >= round.dealerHand.length) {
      if (!settledApplied) {
        setBankroll((b) => b + payout(round));
        setShoe(round.shoe);
        setSettledApplied(true);
      }
      return;
    }
    const t = setTimeout(() => {
      const justRevealed = round.dealerHand[revealedDealerCount];
      if (revealedDealerCount >= 1) setCount((c) => updateCount(c, justRevealed));
      setRevealedDealerCount((c) => c + 1);
    }, 600);
    return () => clearTimeout(t);
  }, [round, revealedDealerCount, settledApplied]);

  const deal = () => {
    if (wager === null || wager > bankroll) return;
    setBankroll((b) => b - wager);

    const reshuffling = shoe.length < RESHUFFLE_BELOW;
    const next = startRound(wager, reshuffling ? undefined : shoe);

    const startingCount = reshuffling ? resetCount() : count;
    setCountBeforeHand(startingCount.runningCount);
    setJustReshuffled(reshuffling);
    setHandsThisShoe((h) => (reshuffling ? 1 : h + 1));

    let c = startingCount;
    [...next.playerHand, next.dealerHand[0]].forEach((card) => {
      c = updateCount(c, card);
    });
    setCount(c);
    setShoe(next.shoe);
    setRound(next);
    setRevealedDealerCount(1); // up-card always visible from the start
    setSettledApplied(false);
    setBustAnswer("");
    setBustChecked(false);
    setCountAnswer("");
    setCountChecked(false);
  };

  const hit = () => {
    if (!round) return;
    const next = playerHit(round);
    const newCard = next.playerHand[next.playerHand.length - 1];
    setCount((c) => updateCount(c, newCard));
    setRound(next);
    setShoe(next.shoe);
    if (next.phase === "settled") {
      setRevealedDealerCount(1);
      setSettledApplied(false);
    } else {
      // The odds shift with every card — a fresh bust question for the new total.
      setBustAnswer("");
      setBustChecked(false);
    }
  };

  const stand = () => {
    if (!round) return;
    setRound(playerStand(round));
    setRevealedDealerCount(1);
    setSettledApplied(false);
  };

  const doubleDown = () => {
    if (!round) return;
    setBankroll((b) => b - round.wager); // the additional stake — original was already deducted at deal time
    const next = playerDoubleDown(round);
    const newCard = next.playerHand[next.playerHand.length - 1];
    setCount((c) => updateCount(c, newCard));
    setRound(next);
    setShoe(next.shoe);
    setRevealedDealerCount(1);
    setSettledApplied(false);
  };

  const playAgain = () => {
    setRound(null);
    setWager(null);
    setRevealedDealerCount(0);
    setSettledApplied(false);
    // shoe and count intentionally carry over — only reshuffle resets them
  };

  const decksRemaining = shoe.length / 52;
  const shoePct = Math.max(0, Math.min(100, (shoe.length / 208) * 100));
  const playerVal = round ? handValue(round.playerHand) : null;
  // How many dealer cards are face-up right now: just the up-card during the
  // player's turn, or however many the staggered reveal has caught up to
  // once the round settles (the hole card, then any dealer hits, one at a
  // time) — every card beyond that renders as a hidden card-back.
  const dealerVisibleCount = round ? (round.phase === "player-turn" ? 1 : revealedDealerCount) : 0;
  const bust = round && round.phase === "player-turn" ? bustProbability(round) : null;
  const bustParsed = parseAnswer(bustAnswer);
  const bustCorrect = !!bust && bustParsed !== null && bustParsed === bust.count;
  const countParsed = parseAnswer(countAnswer);
  const countCorrect = countParsed !== null && countParsed === count.runningCount;
  const isDealing = round?.phase === "settled" && revealedDealerCount < round.dealerHand.length;
  const copy = round?.outcome ? outcomeCopy(round.outcome, round.wager, payout(round)) : null;
  // The running-count check only shows once, right at the top of a hand —
  // asking it again after every single Hit would be tedious; the live HUD
  // keeps the number honest for the rest of the hand instead.
  const showCountQuestion = round && round.phase === "player-turn" && round.playerHand.length === 2;

  if (!introDone) {
    return <BlackjackIntro onDone={() => setIntroDone(true)} />;
  }

  return (
    <div className="answer-content">
      <HiLoHud />

      <p className="pirate-kicker">Quitters Never Lose</p>
      <h1 className="pirate-story-line answer-title">Blackjack</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        Dealer stands on all 17s. Blackjack pays 3:2. Same 4-deck shoe carries across hands until it runs low.
      </p>

      {!round && (
        <div className="pixel-stage casino-felt">
          <div className="bj-felt-top">
            <span className="bj-felt-bankroll">{fmt(bankroll)}</span>
            <span className="bj-shoe-meter">
              <span>SHOE · {decksRemaining.toFixed(1)} DECKS LEFT</span>
              <span className="bj-shoe-bar">
                <span className="bj-shoe-bar-fill" style={{ width: `${shoePct}%` }} />
              </span>
              <span>{handsThisShoe} hand{handsThisShoe === 1 ? "" : "s"} this shoe</span>
            </span>
          </div>

          <p className="bj-felt-title">Place Your Bets</p>

          <div className="bj-chip-tray">
            {WAGER_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                className={wager === w ? `bj-chip denom-${w} active` : `bj-chip denom-${w}`}
                disabled={w > bankroll}
                onClick={() => setWager(w)}
              >
                {w}
              </button>
            ))}
          </div>

          <p className="bj-wager-readout">{wager !== null ? `BET ${fmt(wager)}` : ""}</p>

          <button type="button" className="bj-deal-btn" disabled={wager === null} onClick={deal}>
            Deal
          </button>
        </div>
      )}

      {round && (
        <div className="pixel-stage casino-felt">
          <div className="bj-felt-top">
            <span className="bj-felt-bankroll">{fmt(bankroll)}</span>
            <span className="bj-shoe-meter">
              <span>SHOE · {decksRemaining.toFixed(1)} DECKS LEFT</span>
              <span className="bj-shoe-bar">
                <span className="bj-shoe-bar-fill" style={{ width: `${shoePct}%` }} />
              </span>
              <span>hand {handsThisShoe} · bet {fmt(round.wager)}</span>
            </span>
          </div>

          {justReshuffled && <p className="bj-reshuffle-banner">NEW SHOE — RUNNING COUNT RESET TO 0</p>}

          <div className="bj-table">
            <div className="bj-table-col">
              <p className="bj-table-total">
                {playerVal!.total}
                {playerVal!.isSoft && !playerVal!.isBust ? "s" : ""}
              </p>
              <div className="bj-table-cards">
                {round.playerHand.map((c, i) => (
                  <CardView key={i} card={c} />
                ))}
              </div>
              <p className="bj-table-label">YOU</p>
            </div>
            <div className="bj-table-col">
              <p className="bj-table-total">
                {round.phase === "settled" && revealedDealerCount >= round.dealerHand.length ? handValue(round.dealerHand).total : ""}
              </p>
              <div className="bj-table-cards">
                {round.dealerHand.map((c, i) => (
                  <CardView key={i} card={c} hidden={i >= dealerVisibleCount} />
                ))}
              </div>
              <p className="bj-table-label">DEALER</p>
            </div>
          </div>

          {showCountQuestion && (
            <div className="quiz-panel" style={{ marginTop: 10 }}>
              <p className="quiz-panel-title">Count check</p>
              <div className={countChecked ? (countCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                <p className="quiz-q-topic">Hi-Lo running count</p>
                <p className="quiz-q-prompt">
                  {handsThisShoe <= 1
                    ? "New shoe — the count restarts at 0. Add your 2 cards + the dealer's up-card (not the hidden one). What's the running count?"
                    : "Carry your count forward. Add your 2 cards + the dealer's up-card (not the hidden one) to the count you already had. What's the NEW running count?"}
                </p>
                <div className="quiz-q-input-row">
                  <input
                    type="text"
                    className="quiz-q-input"
                    placeholder="e.g. -2"
                    value={countAnswer}
                    onChange={(e) => setCountAnswer(e.target.value)}
                    disabled={countChecked}
                  />
                  {!countChecked && (
                    <button type="button" className="chip-btn" disabled={!countAnswer} onClick={() => setCountChecked(true)}>
                      Check
                    </button>
                  )}
                </div>
                {countChecked && (
                  <p className={countCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                    {countCorrect ? "✓ Correct. " : `✗ Not quite — it's ${count.runningCount}. `}
                    {handsThisShoe <= 1 ? "Started at 0 (new shoe)" : `Was ${countBeforeHand} coming in`}
                    {`, ${count.runningCount - countBeforeHand >= 0 ? "+" : ""}${count.runningCount - countBeforeHand} from the face-up cards = ${count.runningCount}. `}
                    2–6 = +1, 7–9 = 0, 10–A = −1.
                  </p>
                )}
              </div>
            </div>
          )}

          {round.phase === "player-turn" && bust && (!showCountQuestion || countChecked) && (
            <div className="quiz-panel" style={{ marginTop: 10 }}>
              <p className="quiz-panel-title">Risk check</p>
              <div className={bustChecked ? (bustCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                <p className="quiz-q-topic">Bust probability</p>
                <p className="quiz-q-prompt">
                  You have {playerVal!.total}. Of the {bust.shoeSize} cards left, how many would bust you?
                </p>
                <div className="quiz-q-input-row">
                  <input
                    type="text"
                    className="quiz-q-input"
                    placeholder="type a number"
                    value={bustAnswer}
                    onChange={(e) => setBustAnswer(e.target.value)}
                    disabled={bustChecked}
                  />
                  {!bustChecked && (
                    <button type="button" className="chip-btn" disabled={!bustAnswer} onClick={() => setBustChecked(true)}>
                      Check
                    </button>
                  )}
                </div>
                {bustChecked && (
                  <p className={bustCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
                    {bustCorrect ? "✓ Correct. " : `✗ Not quite — it's ${bust.count}/${bust.shoeSize}. `}
                    = {bust.fraction}, or {(bust.decimal * 100).toFixed(1)}%.
                  </p>
                )}
              </div>
            </div>
          )}

          {round.phase === "player-turn" && bustChecked && (
            <div className="bj-round-btn-row">
              <button type="button" className="bj-round-btn" onClick={hit}>
                Hit
              </button>
              <button type="button" className="bj-round-btn" onClick={stand}>
                Stand
              </button>
              <button type="button" className="bj-round-btn" disabled={round.playerHand.length !== 2} onClick={doubleDown}>
                Double
              </button>
            </div>
          )}

          {isDealing && <p className="qty-hint">Dealer's turn...</p>}

          {round.phase === "settled" && !isDealing && copy && (
            <>
              <ResultBanner outcome={copy.kind} title={copy.title} sub={copy.sub} />
              <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={playAgain}>
                Play again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
