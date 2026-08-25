"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  bustProbability,
  dealerBustProbability,
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
      return { kind: "loss" as const, title: "PUSH", sub: `Your ${fmt(wager)} wager is returned. No gain, no loss.` };
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
// --- "Don't get caught" pressure layer -------------------------------------
// Counting is only worth anything if nobody notices you doing it, so the
// house watches. At random moments the pit boss starts walking over and
// asks for the running count; answer before he arrives. Three failures and
// you're barred. The clock TIGHTENS as your edge improves, because a player
// who keeps winning is exactly the player a casino starts watching — the
// reward and the pressure come from the same place.
const MAX_WARNINGS = 3;
// 70 seconds covers all three answers on a hand — they're one panel with
// one submit, and two of the three are multiple-choice, so this is tight
// but honest.
const HEAT_START_SECONDS = 70;
const HEAT_FLOOR_SECONDS = 15;
const HEAT_SECONDS_PER_CORRECT = 5;

// The edge, from the player's side. Opens negative — the house is always
// ahead of a non-counter — and moves both ways: reading the count right
// converts the house's edge into yours, missing it hands the edge back.
// Magnitudes are exaggerated so the consequence is legible inside one
// session; a real Hi-Lo counter grinds out about 1%.
const HOUSE_OPENING_EDGE = -2;
// Symmetric and chunky on purpose: the player should FEEL the edge move
// with every answer, in both directions. `net` is correct-minus-wrong
// answers, so each answer is worth exactly ±2% — warnings are tracked
// separately (they're about getting caught, not about the odds) and do NOT
// hit the edge a second time.
const EDGE_PER_ANSWER = 2;

function playerEdgePct(net: number): number {
  return HOUSE_OPENING_EDGE + net * EDGE_PER_ANSWER;
}

// Rough win chance on the next hand implied by that edge, clamped so a bad
// run still has a way back and a good one is never a sure thing.
function winChancePct(edgePct: number): number {
  return Math.min(85, Math.max(15, 50 + edgePct));
}

// The edge is DELIBERATELY artificial and it cashes out here: before a
// deal, with probability proportional to |edge|, the shoe is quietly
// reordered. Positive edge slides strong cards (10s) to the player and a
// bust-prone upcard (4/5/6) to the dealer; negative edge does the reverse
// (the player gets a stiff 16, the dealer shows a 10). Real Hi-Lo is worth
// about 1% and would be invisible inside one session — the whole point of
// inflating it is that answering well should FEEL like the table turning
// your way, hand after hand, without every hand being a guaranteed win
// (probability is capped, and an un-rigged hand is still fair).
function biasShoe(shoe: Card[], edgePct: number, rng: () => number = Math.random): Card[] {
  const p = Math.min(0.7, Math.abs(edgePct) * 0.06);
  if (edgePct === 0 || rng() >= p) return shoe;

  const out = [...shoe];
  const n = out.length;
  if (n < 8) return out;

  // startRound pops from the END: [n-1], [n-2] are the player's cards,
  // [n-3] is the dealer's upcard.
  const moveRankTo = (want: (c: Card) => boolean, target: number) => {
    for (let i = n - 8; i >= 0; i--) {
      if (want(out[i])) {
        [out[i], out[target]] = [out[target], out[i]];
        return;
      }
    }
  };

  const isTen = (c: Card) => ["10", "J", "Q", "K"].includes(c.rank);
  const isBusty = (c: Card) => ["4", "5", "6"].includes(c.rank);
  const isSix = (c: Card) => c.rank === "6";

  if (edgePct > 0) {
    moveRankTo(isTen, n - 1);
    moveRankTo(isTen, n - 2);
    moveRankTo(isBusty, n - 3);
  } else {
    moveRankTo(isTen, n - 1);
    moveRankTo(isSix, n - 2);   // player: 10 + 6 = the classic stiff 16
    moveRankTo(isTen, n - 3);   // dealer shows strength
  }
  return out;
}

// Multiple-choice options for the two probability questions. Typed answers
// stay only on the count itself — that's the skill being drilled; the
// probability reads are recognition questions, and chips keep them fast.
function shuffleChoices<T>(arr: T[], seed: number): T[] {
  // Deterministic per hand so re-renders don't reshuffle under the cursor.
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bustChoices(correct: number, shoeSize: number, seed: number): number[] {
  const opts = new Set<number>([correct]);
  for (const d of [4, 8, 12, -4, -8, 6]) {
    if (opts.size >= 4) break;
    const v = correct + d;
    if (v >= 0 && v <= shoeSize) opts.add(v);
  }
  let pad = 1;
  while (opts.size < 4) { opts.add(correct + 16 * pad); pad += 1; }
  return shuffleChoices([...opts], seed);
}

function dealerBustChoices(correctPct: number, seed: number): number[] {
  // Anchored to the real S17 table's spread (about 14% to 42%) so wrong
  // options are plausible neighbours, not obvious throwaways.
  const anchors = [14, 21, 26, 35, 42];
  const correct = Math.round(correctPct);
  const opts = new Set<number>([correct]);
  for (const a of anchors.sort((x, y) => Math.abs(x - correct) - Math.abs(y - correct))) {
    if (opts.size >= 4) break;
    if (Math.abs(a - correct) >= 4) opts.add(a);
  }
  let pad = 1;
  while (opts.size < 4) { opts.add(correct + 5 * pad); pad += 1; }
  return shuffleChoices([...opts], seed);
}

function heatSeconds(netCorrect: number): number {
  // Only success tightens the clock; a bad run never buys MORE time.
  return Math.max(HEAT_FLOOR_SECONDS, HEAT_START_SECONDS - Math.max(0, netCorrect) * HEAT_SECONDS_PER_CORRECT);
}

// The clock drawn as a person rather than a number: he starts across the pit
// and walks toward you. Arriving == time up.
function PitBossSprite() {
  const P = [
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 2, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [1, 0, 3, 3, 3, 0, 1],
    [1, 0, 3, 3, 3, 0, 1],
    [0, 0, 3, 3, 3, 0, 0],
    [0, 0, 4, 0, 4, 0, 0],
    [0, 0, 4, 0, 4, 0, 0],
  ];
  const colors: Record<number, string> = { 1: "#f4f0e8", 2: "#1a1410", 3: "#2a3550", 4: "#1a1410" };
  return (
    <svg viewBox="0 0 7 8" className="dgc-boss-sprite" shapeRendering="crispEdges" aria-hidden="true">
      {P.flatMap((row, y) =>
        row.map((px, x) => (colors[px] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={colors[px]} /> : null)),
      )}
    </svg>
  );
}

function HiLoHud() {
  // Open by default: this is the rule reference, and a collapsed reminder
  // is not a reminder.
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
            <span className="hilo-hud-ref-cards">2 - 6</span>
            <span className="hilo-hud-ref-value is-low">+1</span>
          </div>
          <div className="hilo-hud-ref-row">
            <span className="hilo-hud-ref-cards">7 - 9</span>
            <span className="hilo-hud-ref-value is-mid">0</span>
          </div>
          <div className="hilo-hud-ref-row">
            <span className="hilo-hud-ref-cards">10 - A</span>
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
  const [dealerAnswer, setDealerAnswer] = useState("");
  const [dealerChecked, setDealerChecked] = useState(false);

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

  // Heat: the pit boss, the warnings, and the shrinking clock.
  const [warnings, setWarnings] = useState(0);
  const [heatCorrect, setHeatCorrect] = useState(0);
  const [heatSecondsLeft, setHeatSecondsLeft] = useState(HEAT_START_SECONDS);
  const [banned, setBanned] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const heatTimer = useRef<number | null>(null);

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

  // Everything back to a fresh table: money, shoe, count, heat. Used by
  // cash-out's "clear the table" and by going broke — the only two moments
  // the session actually ends. A settled hand never does this.
  const resetTable = () => {
    setBanned(false);
    setWarnings(0);
    setHeatCorrect(0);
    setShoe(buildShoe(4));
    setCount(resetCount());
    setHandsThisShoe(0);
    setRound(null);
    setWager(null);
    setBankroll(STARTING_BANKROLL);
    setRevealedDealerCount(0);
    setSettledApplied(false);
    setCashOutOpen(false);
  };

  const deal = () => {
    if (wager === null || wager > bankroll) return;
    setBankroll((b) => b - wager);

    const reshuffling = shoe.length < RESHUFFLE_BELOW;
    // The earned (or squandered) edge tilts every deal, fresh shoe or not —
    // see biasShoe for why this is openly artificial.
    const baseShoe = reshuffling ? buildShoe(4) : shoe;
    const next = startRound(wager, biasShoe(baseShoe, playerEdgePct(heatCorrect)));

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
    setDealerAnswer("");
    setDealerChecked(false);
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
      setDealerAnswer("");
      setDealerChecked(false);
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
    setBankroll((b) => b - round.wager); // the additional stake - original was already deducted at deal time
    const next = playerDoubleDown(round);
    const newCard = next.playerHand[next.playerHand.length - 1];
    setCount((c) => updateCount(c, newCard));
    setRound(next);
    setShoe(next.shoe);
    setRevealedDealerCount(1);
    setSettledApplied(false);
  };

  const minWager = Math.min(...WAGER_OPTIONS);
  const isBroke = bankroll < minWager && (!round || round.phase === "settled");
  const decksRemaining = shoe.length / 52;
  const shoePct = Math.max(0, Math.min(100, (shoe.length / 208) * 100));
  const playerVal = round ? handValue(round.playerHand) : null;
  // How many dealer cards are face-up right now: just the up-card during the
  // player's turn, or however many the staggered reveal has caught up to
  // once the round settles (the hole card, then any dealer hits, one at a
  // time) — every card beyond that renders as a hidden card-back.
  const dealerVisibleCount = round ? (round.phase === "player-turn" ? 1 : revealedDealerCount) : 0;
  const bust = round && round.phase === "player-turn" ? bustProbability(round) : null;
  const dealerBust = round && round.phase === "player-turn" ? dealerBustProbability(round) : null;
  const edgePct = playerEdgePct(heatCorrect);
  // Seed the choice shuffles off the hand so they're stable across renders
  // but different every deal.
  const choiceSeed = (round?.playerHand.length ?? 0) * 31 + handsThisShoe * 7 + (bust?.shoeSize ?? 1);
  const bustChoiceList = bust ? bustChoices(bust.count, bust.shoeSize, choiceSeed) : [];
  const dealerChoiceList = dealerBust ? dealerBustChoices(dealerBust.decimal * 100, choiceSeed + 3) : [];
  // Multiple choice: correct means picking the chip that holds the true value.
  const dealerCorrect =
    dealerBust !== null && dealerAnswer !== "" && Number(dealerAnswer) === Math.round(dealerBust.decimal * 100);
  const bustCorrect = !!bust && bustAnswer !== "" && Number(bustAnswer) === bust.count;
  const countParsed = parseAnswer(countAnswer);
  const countCorrect = countParsed !== null && countParsed === count.runningCount;
  const isDealing = round?.phase === "settled" && revealedDealerCount < round.dealerHand.length;
  const copy = round?.outcome ? outcomeCopy(round.outcome, round.wager, payout(round)) : null;
  // The running-count check only shows once, right at the top of a hand —
  // asking it again after every single Hit would be tedious; the live HUD
  // keeps the number honest for the rest of the hand instead.
  const showCountQuestion = round && round.phase === "player-turn" && round.playerHand.length === 2;

  // A missed or timed-out count draws heat. Three strikes and the house bars
  // you — the run ends regardless of how many chips are on the table.
  const issueWarning = useCallback(() => {
    setWarnings((w) => {
      const next = w + 1;
      if (next >= MAX_WARNINGS) setBanned(true);
      return next;
    });
  }, []);

  // The pit boss's walk. Runs only while a count check is actually open.
  useEffect(() => {
    if (!showCountQuestion || countChecked || banned) {
      if (heatTimer.current) { window.clearInterval(heatTimer.current); heatTimer.current = null; }
      return;
    }
    const limit = heatSeconds(heatCorrect);
    setHeatSecondsLeft(limit);
    const startedAt = Date.now();
    heatTimer.current = window.setInterval(() => {
      const remaining = limit - (Date.now() - startedAt) / 1000;
      if (remaining <= 0) {
        if (heatTimer.current) { window.clearInterval(heatTimer.current); heatTimer.current = null; }
        setHeatSecondsLeft(0);
        setCountChecked(true); // reveals the answer, same as a wrong guess
        issueWarning();
      } else {
        setHeatSecondsLeft(remaining);
      }
    }, 100);
    return () => {
      if (heatTimer.current) { window.clearInterval(heatTimer.current); heatTimer.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCountQuestion, countChecked, banned, heatCorrect]);

  // One submission grades BOTH answers (count + your bust-card count) so the
  // hand never stops twice. Each one moves the edge on its own: +2% right,
  // −2% wrong. A missed COUNT also draws heat — the count is what the pit
  // boss actually asked for; the bust estimate is you talking to yourself.
  const submitChecks = () => {
    if (countChecked) return;
    setCountChecked(true);
    setBustChecked(true);
    if (heatTimer.current) { window.clearInterval(heatTimer.current); heatTimer.current = null; }

    const countRight = parseInt(countAnswer.trim(), 10) === count.runningCount;
    const bustRight = bust !== null && bustAnswer !== "" && Number(bustAnswer) === bust.count;
    const dealerRight =
      dealerBust !== null && dealerAnswer !== "" && Number(dealerAnswer) === Math.round(dealerBust.decimal * 100);

    // Every answer moves the edge on its own: right pushes it your way,
    // wrong hands it back. ±2 per answer, so a clean sweep is +6.
    let delta = 0;
    delta += countRight ? 1 : -1;
    delta += bustRight ? 1 : -1;
    delta += dealerRight ? 1 : -1;
    setHeatCorrect((n) => n + delta);

    if (!countRight) issueWarning();
  };

  if (!introDone) {
    return <BlackjackIntro onDone={() => setIntroDone(true)} />;
  }

  // Barred from the table: the run is over no matter what the bankroll says.
  // This sits ahead of the normal table render so there's no way to keep
  // playing past a third warning.
  if (banned) {
    return (
      <div className="answer-content">
        <p className="pirate-kicker">Quitters Never Lose</p>
        <h1 className="pirate-story-line answer-title">Barred</h1>
        <div className="pixel-stage" style={{ textAlign: "center" }}>
          <p className="dgc-caught-title">Third warning. The pit boss walks you out.</p>
          <p className="dgc-caught-body">
            You left with <strong>{fmt(bankroll)}</strong> after {handsThisShoe} hand
            {handsThisShoe === 1 ? "" : "s"} on this shoe, and called <strong>{heatCorrect}</strong> count
            {heatCorrect === 1 ? "" : "s"} correctly before they noticed.
          </p>
          <p className="mm-step-hint" style={{ marginBottom: 16 }}>
            Counting is legal. But the house is allowed to refuse your business, and hesitating over the count is
            what gives you away.
          </p>
          <button
            type="button"
            className="continue-btn"
            onClick={resetTable}
          >
            Find another casino
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="answer-content">
      <HiLoHud />

      <p className="pirate-kicker">Quitters Never Lose</p>
      <h1 className="pirate-story-line answer-title">Blackjack</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        Dealer stands on all 17s. Blackjack pays 3:2. Same 4-deck shoe carries across hands until it runs low.
      </p>

      <div className="pixel-stage casino-felt">
          <div className="bj-felt-top">
            <span className="bj-felt-bankroll">{fmt(bankroll)}</span>
            <span className="bj-shoe-meter">
              <span>SHOE · {decksRemaining.toFixed(1)} DECKS LEFT</span>
              <span className="bj-shoe-bar">
                <span className="bj-shoe-bar-fill" style={{ width: `${shoePct}%` }} />
              </span>
              <span>hand {handsThisShoe}{round ? ` · bet ${fmt(round.wager)}` : ""}</span>
            </span>
          </div>

          {/* The readout that makes counting feel like it's paying for
              something: the edge you've built, the win chance it implies,
              and the heat it's attracting. */}
          <div className="bj-edge-hud">
            <span>
              EDGE{" "}
              <strong className={edgePct >= 0 ? "dgc-edge-good" : "dgc-edge-bad"}>
                {edgePct >= 0 ? "+" : ""}{edgePct.toFixed(1)}%
              </strong>
            </span>
            <span>WIN <strong>{winChancePct(edgePct).toFixed(0)}%</strong></span>
            <span>COUNTS <strong>{heatCorrect}</strong></span>
            <span>
              HEAT{" "}
              <strong className={warnings > 0 ? "dgc-edge-bad" : undefined}>
                {warnings}/{MAX_WARNINGS}
              </strong>
            </span>
            <span>CLOCK <strong>{heatSeconds(heatCorrect)}s</strong></span>
          </div>

          {justReshuffled && <p className="bj-reshuffle-banner">NEW SHOE · RUNNING COUNT RESET TO 0</p>}

          {round && (
            <>

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

          {showCountQuestion && !countChecked && (
            <div className="dgc-pit" aria-label="The pit boss is walking over">
              <div className="dgc-pit-track">
                <div
                  className="dgc-pit-walker"
                  style={{ left: `${(1 - heatSecondsLeft / heatSeconds(heatCorrect)) * 100}%` }}
                >
                  <PitBossSprite />
                </div>
              </div>
              <div className="dgc-pit-you">{heatSecondsLeft.toFixed(1)}s</div>
            </div>
          )}

          {showCountQuestion && (
            <div className="quiz-panel" style={{ marginTop: 10 }}>
              <p className="quiz-panel-title">
                Table check
                <span className="bj-warning-pips">
                  {Array.from({ length: MAX_WARNINGS }, (_, i) => (
                    <span key={i} className={i < warnings ? "bj-warning-pip is-lit" : "bj-warning-pip"} />
                  ))}
                </span>
              </p>

              {/* One panel, one submit: typed count + two multiple-choice
                  probability reads. The hand pauses exactly once. */}
              <div className="bj-check-grid">
                <div className={countChecked ? (countCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                  <p className="quiz-q-topic">Hi-Lo count</p>
                  <input
                    type="text"
                    className="quiz-q-input"
                    placeholder="e.g. -2"
                    value={countAnswer}
                    onChange={(e) => setCountAnswer(e.target.value)}
                    disabled={countChecked}
                  />
                  {countChecked && !countCorrect && (
                    <p className="quiz-q-explain is-wrong">✗ {count.runningCount}</p>
                  )}
                </div>

                {bust && (
                  <div className={countChecked ? (bustCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                    <p className="quiz-q-topic">
                      Cards that bust you <span className="bj-q-sub">of {bust.shoeSize}</span>
                    </p>
                    <div className="bj-choice-row">
                      {bustChoiceList.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={bustAnswer === String(c) ? "chip-btn active" : "chip-btn"}
                          disabled={countChecked}
                          onClick={() => setBustAnswer(String(c))}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {countChecked && !bustCorrect && (
                      <p className="quiz-q-explain is-wrong">✗ {bust.count} ({(bust.decimal * 100).toFixed(0)}%)</p>
                    )}
                  </div>
                )}

                {dealerBust && (
                  <div className={countChecked ? (dealerCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
                    <p className="quiz-q-topic">
                      Dealer busts <span className="bj-q-sub">showing {round.dealerHand[0].rank}</span>
                    </p>
                    <div className="bj-choice-row">
                      {dealerChoiceList.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={dealerAnswer === String(c) ? "chip-btn active" : "chip-btn"}
                          disabled={countChecked}
                          onClick={() => setDealerAnswer(String(c))}
                        >
                          {c}%
                        </button>
                      ))}
                    </div>
                    {countChecked && !dealerCorrect && (
                      <p className="quiz-q-explain is-wrong">✗ {dealerBust.percent}</p>
                    )}
                  </div>
                )}
              </div>

              {!countChecked && (
                <button
                  type="button"
                  className="continue-btn"
                  style={{ marginTop: 10 }}
                  disabled={!countAnswer || !bustAnswer || !dealerAnswer}
                  onClick={submitChecks}
                >
                  Answer
                </button>
              )}
            </div>
          )}

          {round.phase === "player-turn" && (!showCountQuestion || countChecked) && (
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
            <ResultBanner outcome={copy.kind} title={copy.title} sub={copy.sub} />
          )}
            </>
          )}

          {/* Betting lives ON the felt - before the first hand and again the
              moment one settles. The table never leaves the screen, so a new
              bet reads as the next hand at the same table, not a restart.
              The last wager stays selected for one-click re-bets. */}
          {(!round || (round.phase === "settled" && !isDealing)) && !isBroke && (
            <div className="bj-rebet-row">
              {!round && <p className="bj-felt-title">Place Your Bets</p>}
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
              <button type="button" className="bj-deal-btn" disabled={wager === null || wager > bankroll} onClick={deal}>
                Deal{wager !== null ? ` ${fmt(wager)}` : ""}
              </button>
            </div>
          )}

          {/* Out of money with no hand live: the one ending that genuinely
              is over. No "play again" euphemism - the table takes your seat. */}
          {isBroke && (
            <div className="bj-rebet-row">
              <p className="dgc-caught-title">Bankroll&rsquo;s gone. The table takes your seat.</p>
              <button type="button" className="continue-btn" onClick={resetTable}>
                Start over
              </button>
            </div>
          )}

          {/* Always present, never modal: the way OUT is one click away at
              any point, instead of the game deciding when a session ends. */}
          {!isBroke && (
            <div className="bj-cashout-row">
              {!cashOutOpen ? (
                <button type="button" className="bj-cashout-btn" onClick={() => setCashOutOpen(true)}>
                  Cash out
                </button>
              ) : (
                <div className="bj-cashout-confirm">
                  <span>Walk with {fmt(bankroll)}?</span>
                  <button type="button" className="chip-btn" onClick={resetTable}>
                    Cash out &amp; clear table
                  </button>
                  <button type="button" className="chip-btn" onClick={() => setCashOutOpen(false)}>
                    Keep playing
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
