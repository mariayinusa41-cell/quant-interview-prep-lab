"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { useAccess } from "../../../../../access/AccessContext";
import { scratchEntryKey } from "../QuestionCountPicker";
import { pickTemplate, drawOutcome, parseAnswer, type Template, type Outcome } from "./templates";
import { buildQuestionSet, type QuestionInstance } from "./questions";
import { TICKET_THEMES, PixelThemeIcon, type TicketTheme } from "./ticketThemes";

const STARTING_BANKROLL = 100;
const TICKET_PRICES = [1, 5, 10, 20, 50, 100];

// Each ticket's question set gets its own countdown, sized to the number of
// questions in it — not a session-wide clock. It resets fresh every time a
// new ticket is bought.
const SECONDS_PER_QUESTION = 45;

function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

// Full-size single-ticket reveal uses a 10x6 scratch grid; a multi-ticket
// buy renders one small card per ticket, so those use a lighter 6x4 grid —
// still plenty of tiles to scatter, without spawning hundreds of DOM nodes
// per card once someone buys a stack of them.
const SCRATCH_COLS = 10;
const SCRATCH_ROWS = 6;
const SCRATCH_TILE_COUNT = SCRATCH_COLS * SCRATCH_ROWS;
const MINI_COLS = 6;
const MINI_ROWS = 4;
const MINI_TILE_COUNT = MINI_COLS * MINI_ROWS;

type ScatterSeed = { tx: number; ty: number; tr: number; delay: number };

function makeScatter(count: number): ScatterSeed[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 70;
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      tr: (Math.random() - 0.5) * 260,
      delay: Math.random() * 0.2,
    };
  });
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtSigned(n: number) {
  return n >= 0 ? `+${fmt(n)}` : `-${fmt(Math.abs(n))}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Outcome probabilities are always clean dyadic fractions (x/8 or x/16) by
// generator design — reduce whichever denominator matches exactly, rather
// than relying on a fixed lookup, so generated shapes display as cleanly as
// the old hand-authored ones did.
function fractionOf(prob: number): string {
  for (const denom of [8, 16]) {
    const numerator = Math.round(prob * denom);
    if (Math.abs(numerator / denom - prob) < 1e-9) {
      const g = gcd(numerator, denom) || 1;
      const n = numerator / g;
      const d = denom / g;
      return d === 1 ? `${n}` : `${n}/${d}`;
    }
  }
  return prob.toString();
}

// phase is "flip" before the pick's odds are revealed, a number index while
// working through this round's question set, "decision" for the buy-quantity
// step, and "revealed" for the scratch stage.
type Phase = "flip" | number | "decision" | "revealed";

type Round = {
  price: number;
  template: Template;
  phase: Phase;
  questionSet: QuestionInstance[]; // built fresh via buildQuestionSet every round
  answers: Partial<Record<number, string>>; // keyed by index into questionSet
  checked: Partial<Record<number, boolean>>;
  secondsLeft: number | null; // this round's own countdown; null if untimed
  forfeited: boolean; // true if the round's timer hit 0 before all questions were answered
  pendingQty: number; // being chosen at the decision stage; starts at 1 (the ticket already paid for)
  quantity: number | null; // finalized once the purchase is confirmed
  outcomes: Outcome[]; // one draw per ticket bought; empty until quantity is confirmed
  scratchedFlags: boolean[];
  scatterSets: ScatterSeed[][];
};

function oddsList(template: Template, price: number): { label: string; frac: string }[] {
  return template.outcomes.map((o) => ({
    label: o.mult === 0 ? "$0" : fmt(o.mult * price),
    frac: fractionOf(o.prob),
  }));
}

export default function ScratchOffGame() {
  const searchParams = useSearchParams();
  const perTicketParam = searchParams.get("perTicket");
  const questionsPerTicket: 7 | 13 = perTicketParam === "13" ? 13 : 7; // default 7
  const timed = searchParams.get("timed") === "1";
  const roundTimeBudget = timed ? questionsPerTicket * SECONDS_PER_QUESTION : null;

  // Must match the id QuestionCountPicker.tsx gates on, or a free user would
  // be charged against a different game's session pool than the one they
  // bought.
  const gameId = `probability-scratch-${timed ? "timed" : "untimed"}-${questionsPerTicket}`;
  const { startGameEntry } = useAccess();

  // A "round" is one TICKET, not one visit to this page. Previously nothing
  // in here touched the access system at all: the only charge happened on
  // the picker screen when navigating in, so a free user could buy an
  // unlimited number of tickets as long as they never left the page, and
  // the 3-round session only ticked down by going back and clicking through
  // again.
  //
  // The picker's click already charged for a session, and that pays for the
  // first ticket. It signals this by leaving a one-shot sessionStorage
  // marker, which the first buyTicket consumes. Deliberately NOT a ref:
  // a ref resets on reload, so refreshing the page would have granted an
  // extra free ticket every time — the same unlimited-play hole in a
  // different shape.
  const [outOfRounds, setOutOfRounds] = useState(false);
  const claimPrepaidEntry = () => {
    try {
      const key = scratchEntryKey(gameId);
      if (window.sessionStorage.getItem(key) === "1") {
        window.sessionStorage.removeItem(key);
        return true;
      }
    } catch {
      /* storage unavailable — fall through and charge normally */
    }
    return false;
  };

  const [bankroll, setBankroll] = useState(STARTING_BANKROLL);
  const [history, setHistory] = useState<number[]>([STARTING_BANKROLL]);
  const [ticketsBought, setTicketsBought] = useState(0);
  const [physicalTickets, setPhysicalTickets] = useState(0);
  const [questionsAnsweredTotal, setQuestionsAnsweredTotal] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [round, setRound] = useState<Round | null>(null);
  const [cornerFlipped, setCornerFlipped] = useState(false);
  const [hudOpen, setHudOpen] = useState(true);

  const totalSpent = ticketsBought > 0 ? STARTING_BANKROLL - bankroll + totalWon : 0;
  const net = bankroll - STARTING_BANKROLL;
  const ruined = !cashedOut && !round && ticketsBought > 0 && bankroll <= 0;
  // No question-count or session-wide time limit — the session only ends on
  // going broke or choosing to cash out. Each round's own timer can forfeit
  // that round's remaining questions, but never ends the game by itself.
  const gameEnded = cashedOut || ruined;

  // Per-round countdown — a self-chaining relative timer (each tick
  // schedules the next one) so it can't drift or double-fire. Only ticks
  // while the round is actually on a question (not the flip, decision, or
  // revealed stages), and resets fresh every time buyTicket runs.
  useEffect(() => {
    if (!round || round.secondsLeft === null) return;
    if (typeof round.phase !== "number") return;

    if (round.secondsLeft <= 0) {
      setRound((r) => {
        if (!r) return null;
        const checked = { ...r.checked };
        r.questionSet.forEach((_, i) => {
          if (!checked[i]) checked[i] = true; // forfeited - ungraded, so it reads as incorrect
        });
        return { ...r, checked, forfeited: true, phase: "decision" };
      });
      return;
    }

    const t = setTimeout(() => {
      setRound((r) => (r && typeof r.phase === "number" ? { ...r, secondsLeft: (r.secondsLeft ?? 0) - 1 } : r));
    }, 1000);
    return () => clearTimeout(t);
  }, [round?.secondsLeft, round?.phase]);

  const buyTicket = (price: number) => {
    if (round || price > bankroll || gameEnded) return;

    // The first ticket rides on the entry that already charged for this
    // session; every subsequent one spends a round (and buys a fresh
    // session once the current one is used up). If the player can't afford
    // another session, stop here rather than handing out a free ticket.
    if (!claimPrepaidEntry()) {
      if (!startGameEntry(gameId)) {
        setOutOfRounds(true);
        return;
      }
    }
    setOutOfRounds(false);

    setCornerFlipped(false);
    setBankroll((b) => b - price);
    setTicketsBought((n) => n + 1);
    const template = pickTemplate();
    const questionSet = buildQuestionSet(questionsPerTicket);
    setRound({
      price,
      template,
      phase: "flip",
      questionSet,
      answers: {},
      checked: {},
      secondsLeft: roundTimeBudget, // fresh timer every round, not a shared session clock
      forfeited: false,
      pendingQty: 1,
      quantity: null,
      outcomes: [],
      scratchedFlags: [],
      scatterSets: [],
    });
  };

  const startQuestions = () => {
    if (!round) return;
    setRound({ ...round, phase: 0 });
  };

  const setAnswer = (index: number, value: string) => {
    if (!round) return;
    setRound({ ...round, answers: { ...round.answers, [index]: value } });
  };

  const checkAnswer = (index: number) => {
    if (!round) return;
    setRound({ ...round, checked: { ...round.checked, [index]: true } });
    setQuestionsAnsweredTotal((n) => n + 1); // running stat only, not a cap
  };

  const nextQuestion = () => {
    if (!round) return;
    const idx = round.phase as number;
    const next: Phase = idx < round.questionSet.length - 1 ? idx + 1 : "decision";
    setRound({ ...round, phase: next });
  };

  const maxQtyFor = (price: number) => Math.min(1 + Math.floor(bankroll / price), 10);

  const adjustQty = (delta: number) => {
    if (!round) return;
    const max = maxQtyFor(round.price);
    const next = Math.max(0, Math.min(round.pendingQty + delta, max));
    setRound({ ...round, pendingQty: next });
  };

  const confirmQuantity = () => {
    if (!round) return;
    const qty = round.pendingQty;

    if (qty === 0) {
      // Walk away: refund the ticket already charged at pick time. Draw one
      // outcome anyway, purely so the reveal screen has something to show
      // "for the record" — it never pays out.
      const outcome = drawOutcome(round.template);
      setBankroll((b) => {
        const next = b + round.price;
        setHistory((h) => [...h, next]);
        return next;
      });
      setRound({
        ...round,
        quantity: 0,
        outcomes: [outcome],
        scratchedFlags: [false],
        scatterSets: [makeScatter(SCRATCH_TILE_COUNT)],
        phase: "revealed",
      });
      return;
    }

    const extra = qty - 1; // beyond the one ticket already paid for
    if (extra > 0) setBankroll((b) => b - extra * round.price);
    setPhysicalTickets((n) => n + qty);
    const outcomes = Array.from({ length: qty }, () => drawOutcome(round.template));
    const tileCount = qty > 1 ? MINI_TILE_COUNT : SCRATCH_TILE_COUNT;
    setRound({
      ...round,
      quantity: qty,
      outcomes,
      scratchedFlags: outcomes.map(() => false),
      scatterSets: outcomes.map(() => makeScatter(tileCount)),
      phase: "revealed",
    });
  };

  const revealWalkAway = () => {
    if (!round || round.scratchedFlags[0]) return;
    setRound({ ...round, scratchedFlags: [true] });
  };

  const scratchOne = (i: number) => {
    if (!round || round.scratchedFlags[i]) return;
    const won = round.outcomes[i].mult * round.price;
    const flags = [...round.scratchedFlags];
    flags[i] = true;
    setRound({ ...round, scratchedFlags: flags });
    setBankroll((b) => {
      const next = b + won;
      setHistory((h) => [...h, next]);
      return next;
    });
    setTotalWon((w) => w + won);
  };

  const scratchAll = () => {
    if (!round) return;
    let payout = 0;
    const flags = round.scratchedFlags.map((done, i) => {
      if (!done) payout += round.outcomes[i].mult * round.price;
      return true;
    });
    setRound({ ...round, scratchedFlags: flags });
    if (payout > 0) {
      setBankroll((b) => {
        const next = b + payout;
        setHistory((h) => [...h, next]);
        return next;
      });
      setTotalWon((w) => w + payout);
    }
  };

  const finishRound = () => setRound(null);

  const sparkline = useMemo(() => {
    if (history.length < 2) return "";
    const w = 280;
    const h = 70;
    const max = Math.max(...history, STARTING_BANKROLL);
    const min = Math.min(...history, 0);
    const range = Math.max(max - min, 1);
    return history
      .map((v, i) => {
        const x = (i / (history.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [history]);

  const roundTimerLive = round && typeof round.phase === "number" ? round.secondsLeft : null;

  return (
    <div className={round && round.phase !== "flip" ? "answer-content scratch-game has-mini-badge" : "answer-content scratch-game"}>
      <div className={hudOpen ? "bankroll-hud is-open" : "bankroll-hud"}>
        <button type="button" className="bankroll-hud-toggle" onClick={() => setHudOpen((o) => !o)}>
          <span className="bankroll-hud-toggle-amount">{fmt(Math.max(bankroll, 0))}</span>
          <span className="bankroll-hud-toggle-caret">{hudOpen ? "▾" : "▸"}</span>
        </button>
        {hudOpen && (
          <div className="bankroll-hud-body">
            <div className="bankroll-stat">
              <span className="bankroll-stat-label">Bankroll</span>
              <span className={net >= 0 ? "bankroll-stat-value is-up" : "bankroll-stat-value is-down"}>
                {fmt(Math.max(bankroll, 0))}
              </span>
            </div>
            <div className="bankroll-stat">
              <span className="bankroll-stat-label">Questions answered</span>
              <span className="bankroll-stat-value">{questionsAnsweredTotal}</span>
            </div>
            <div className="bankroll-stat">
              <span className="bankroll-stat-label">Tickets</span>
              <span className="bankroll-stat-value">{ticketsBought}</span>
            </div>
            {timed && roundTimeBudget !== null && (
              <div className="bankroll-stat">
                <span className="bankroll-stat-label">{roundTimerLive !== null ? "Round timer" : `Per ticket (${questionsPerTicket}q)`}</span>
                <span className={roundTimerLive !== null && roundTimerLive <= 15 ? "bankroll-stat-value is-down" : "bankroll-stat-value"}>
                  {fmtClock(roundTimerLive ?? roundTimeBudget)}
                </span>
              </div>
            )}
            <div className="bankroll-stat">
              <span className="bankroll-stat-label">Spent</span>
              <span className="bankroll-stat-value">{fmt(totalSpent)}</span>
            </div>
            <div className="bankroll-stat">
              <span className="bankroll-stat-label">Won</span>
              <span className="bankroll-stat-value">{fmt(totalWon)}</span>
            </div>
            <div className="bankroll-stat">
              <span className="bankroll-stat-label">Net</span>
              <span className={net >= 0 ? "bankroll-stat-value is-up" : "bankroll-stat-value is-down"}>
                {fmtSigned(net)}
              </span>
            </div>
            {history.length > 1 && (
              <svg viewBox="0 0 280 70" className="bankroll-spark" preserveAspectRatio="none">
                <polyline points={sparkline} fill="none" stroke="#f4c542" strokeWidth="2" />
              </svg>
            )}
          </div>
        )}
      </div>

      {!gameEnded && !round && (
        <div className="ticket-price-picker">
          <p className="quiz-panel-title">Pick a ticket:</p>
          <div className="ticket-theme-grid">
            {TICKET_PRICES.map((price) => {
              const theme = TICKET_THEMES[price];
              const affordable = price <= bankroll;
              return (
                <button
                  key={price}
                  type="button"
                  className="ticket-theme-btn"
                  disabled={!affordable}
                  onClick={() => buyTicket(price)}
                  style={{ "--theme-accent": theme.accent } as CSSProperties}
                >
                  <PixelThemeIcon theme={theme} className="pixel-theme-icon" />
                  <span className="ticket-theme-name">{theme.name}</span>
                  <span className="ticket-theme-price">${price}</span>
                </button>
              );
            })}
          </div>
          {outOfRounds && (
            <p className="quiz-q-explain is-wrong" style={{ marginTop: 10 }}>
              You&rsquo;re out of rounds for this game and don&rsquo;t have enough tokens for another session. Cash
              out to keep what you&rsquo;re holding, or come back with more tokens.
            </p>
          )}
          <button type="button" className="chip-btn scratch-cashout-alt" onClick={() => setCashedOut(true)}>
            Cash out instead
          </button>
        </div>
      )}

      {round && round.phase === "flip" && (
        <FlipReveal
          theme={TICKET_THEMES[round.price]}
          template={round.template}
          price={round.price}
          onContinue={startQuestions}
        />
      )}

      {round && round.phase !== "flip" && (
        <button
          type="button"
          className={cornerFlipped ? "mini-ticket-badge is-flipped" : "mini-ticket-badge"}
          style={{ "--theme-accent": TICKET_THEMES[round.price].accent } as CSSProperties}
          onClick={() => setCornerFlipped((f) => !f)}
          aria-label="Flip to see this ticket's odds"
        >
          <div className="mini-badge-inner">
            <div className="mini-badge-face mini-badge-front">
              <PixelThemeIcon theme={TICKET_THEMES[round.price]} className="pixel-theme-icon" />
              <span className="mini-badge-price">{fmt(round.price)}</span>
            </div>
            <div className="mini-badge-face mini-badge-back">
              {oddsList(round.template, round.price).map((o, i) => (
                <div className="mini-badge-odds-row" key={i}>
                  <span>{o.label}</span>
                  <span className="frac">{o.frac}</span>
                </div>
              ))}
            </div>
          </div>
        </button>
      )}

      {round && typeof round.phase === "number" && (
        <QuestionCard
          round={round}
          index={round.phase}
          onAnswerChange={(v) => setAnswer(round.phase as number, v)}
          onCheck={() => checkAnswer(round.phase as number)}
          onNext={nextQuestion}
        />
      )}

      {round && round.phase === "decision" && (
        <div className="quiz-panel">
          {round.forfeited && (
            <p className="qty-hint" style={{ color: "#f05a5a" }}>
              Time ran out - any unanswered questions were marked incorrect.
            </p>
          )}
          <p className="quiz-panel-title">
            Knowing the true odds and the expected payout - how many {TICKET_THEMES[round.price].name} tickets do you
            want in total?
          </p>
          <div className="ticket-qty-picker">
            <button type="button" className="chip-btn qty-btn" onClick={() => adjustQty(-1)} disabled={round.pendingQty <= 0}>
              −
            </button>
            <span className="ticket-qty-value">{round.pendingQty}</span>
            <button
              type="button"
              className="chip-btn qty-btn"
              onClick={() => adjustQty(1)}
              disabled={round.pendingQty >= maxQtyFor(round.price)}
            >
              +
            </button>
          </div>
          <p className="qty-hint">
            {round.pendingQty === 0
              ? `Walk away - your ${fmt(round.price)} is refunded.`
              : `Total cost: ${fmt(round.pendingQty * round.price)} (bankroll allows up to ${maxQtyFor(round.price)} at once).`}
          </p>
          <button type="button" className="continue-btn" onClick={confirmQuantity}>
            {round.pendingQty === 0 ? "Confirm - walk away" : `Buy ${round.pendingQty}`}
          </button>
        </div>
      )}

      {round && round.phase === "revealed" && (
        <div className="scratch-stage">
          {round.quantity === 0 && (
            <p className="pirate-story-line" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)" }}>
              You walked away - your {fmt(round.price)} is refunded. Here's what that ticket would have paid, for the
              record.
            </p>
          )}

          <div className="ticket-theme-header">
            <PixelThemeIcon theme={TICKET_THEMES[round.price]} className="pixel-theme-icon is-large" />
            <span className="ticket-theme-header-name">
              {TICKET_THEMES[round.price].name}
              {round.quantity !== null && round.quantity > 1 ? ` × ${round.quantity}` : ""}
            </span>
          </div>

          {round.quantity !== null && round.quantity <= 1 ? (
            <ScratchTicketCard
              theme={TICKET_THEMES[round.price]}
              outcome={round.outcomes[0]}
              price={round.price}
              scratched={round.scratchedFlags[0]}
              onScratch={round.quantity === 1 ? () => scratchOne(0) : undefined}
              scatter={round.scatterSets[0]}
              cols={SCRATCH_COLS}
              rows={SCRATCH_ROWS}
              wouldHaveLabel={round.quantity === 0}
            />
          ) : (
            <>
              <div className="scratch-multi-grid">
                {round.outcomes.map((o, i) => (
                  <ScratchTicketCard
                    key={i}
                    theme={TICKET_THEMES[round.price]}
                    outcome={o}
                    price={round.price}
                    scratched={round.scratchedFlags[i]}
                    onScratch={() => scratchOne(i)}
                    scatter={round.scatterSets[i]}
                    cols={MINI_COLS}
                    rows={MINI_ROWS}
                    compact
                  />
                ))}
              </div>
              {round.scratchedFlags.some((f) => !f) && (
                <button type="button" className="chip-btn" onClick={scratchAll}>
                  Scratch all
                </button>
              )}
            </>
          )}

          {round.quantity === 0 && !round.scratchedFlags[0] && (
            <button type="button" className="continue-btn" onClick={revealWalkAway}>
              Reveal anyway
            </button>
          )}

          {round.scratchedFlags.length > 0 && round.scratchedFlags.every((f) => f) && (
            <button type="button" className="continue-btn" onClick={finishRound}>
              Continue
            </button>
          )}
        </div>
      )}

      {gameEnded && (
        <div className="scratch-summary">
          <p className={net >= 0 ? "scratch-summary-headline is-up" : "scratch-summary-headline is-down"}>
            {ruined
              ? "Bankroll hit zero. That's gambler's ruin."
              : net >= 0
                ? `You quit up ${fmt(net)}. That's the whole lesson.`
                : `You quit down ${fmt(Math.abs(net))}.`}
          </p>
          <p className="pirate-story-line" style={{ fontSize: "0.95rem" }}>
            Over {ticketsBought} round{ticketsBought === 1 ? "" : "s"} ({physicalTickets} ticket
            {physicalTickets === 1 ? "" : "s"} total, {questionsAnsweredTotal} question
            {questionsAnsweredTotal === 1 ? "" : "s"} answered), you spent {fmt(totalSpent)} and won back {fmt(totalWon)}.
          </p>
          <p className="pirate-story-line" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.55)" }}>
            Most tickets in this game pay out 7/8 of what you paid - a 12.5% house edge. Every once in a while the
            odds flip in your favor; the trick is spotting it on the flip-reveal and sizing up before you scratch.
            Either way, the only guaranteed way to keep what you're up is to stop.
          </p>
          <button
            type="button"
            className="chip-btn"
            onClick={() => {
              setBankroll(STARTING_BANKROLL);
              setHistory([STARTING_BANKROLL]);
              setTicketsBought(0);
              setPhysicalTickets(0);
              setQuestionsAnsweredTotal(0);
              setTotalWon(0);
              setRound(null);
              setCashedOut(false);
              // Not a free re-entry: the marker is already consumed, so the
              // next ticket bought after restarting spends a round like any
              // other.
              setOutOfRounds(false);
            }}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

function FlipReveal({
  theme,
  template,
  price,
  onContinue,
}: {
  theme: TicketTheme;
  template: Template;
  price: number;
  onContinue: () => void;
}) {
  const [stage, setStage] = useState<"enter" | "flipped">("enter");

  // Enlarge first, then flip — a short relative delay per stage, chained
  // through the phase itself so it can't drift or double-fire.
  useEffect(() => {
    if (stage !== "enter") return;
    const t = setTimeout(() => setStage("flipped"), 500);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="flip-stage">
      <p className="quiz-panel-title">You picked...</p>
      <div className={stage === "flipped" ? "flip-card is-flipped" : "flip-card"} style={{ "--theme-accent": theme.accent } as CSSProperties}>
        <div className="flip-card-inner">
          <div className="flip-card-face flip-card-front">
            <PixelThemeIcon theme={theme} className="pixel-theme-icon is-large" />
            <span className="flip-card-name">{theme.name}</span>
            <span className="flip-card-price">${price}</span>
          </div>
          <div className="flip-card-face flip-card-back">
            <p className="flip-card-back-title">Price &amp; odds</p>
            <div className="odds-panel-list">
              {oddsList(template, price).map((o, i) => (
                <div className="odds-panel-item" key={i}>
                  <span className="odds-panel-amount">{o.label}</span>
                  <span className="odds-panel-frac">{o.frac}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {stage === "flipped" && (
        <button type="button" className="continue-btn" onClick={onContinue}>
          Continue
        </button>
      )}
    </div>
  );
}

function ScratchTicketCard({
  theme,
  outcome,
  price,
  scratched,
  onScratch,
  scatter,
  cols,
  rows,
  compact,
  wouldHaveLabel,
}: {
  theme: TicketTheme;
  outcome: Outcome;
  price: number;
  scratched: boolean;
  onScratch?: () => void;
  scatter: ScatterSeed[];
  cols: number;
  rows: number;
  compact?: boolean;
  wouldHaveLabel?: boolean;
}) {
  const tiles = cols * rows;
  return (
    <div className={compact ? "scratch-ticket is-compact" : "scratch-ticket"} style={{ "--theme-accent": theme.accent } as CSSProperties}>
      <div className={scratched ? "scratch-result is-revealed" : "scratch-result"}>
        {outcome.mult > 0 ? (
          <>
            <span className="scratch-prize-amount">{fmt(outcome.mult * price)}</span>
            <span className="scratch-prize-label">{wouldHaveLabel ? "Would've won!" : "You won!"}</span>
          </>
        ) : (
          <span className="scratch-prize-label is-nothing">No prize</span>
        )}
      </div>

      <div
        className={scratched ? "scratch-surface is-scratched" : "scratch-surface"}
        onClick={!scratched ? onScratch : undefined}
        role="button"
        tabIndex={0}
      >
        {Array.from({ length: tiles }, (_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const seed = scatter[i];
          return (
            <span
              key={i}
              className="scratch-tile"
              style={
                {
                  left: `${(col / cols) * 100}%`,
                  top: `${(row / rows) * 100}%`,
                  width: `${100 / cols}%`,
                  height: `${100 / rows}%`,
                  "--tx": `${seed.tx}px`,
                  "--ty": `${seed.ty}px`,
                  "--tr": `${seed.tr}deg`,
                  animationDelay: `${seed.delay}s`,
                } as CSSProperties
              }
            />
          );
        })}
        {!scratched && onScratch && <span className="scratch-surface-label">{compact ? "SCRATCH" : "SCRATCH HERE"}</span>}
      </div>
    </div>
  );
}

function QuestionCard({
  round,
  index,
  onAnswerChange,
  onCheck,
  onNext,
}: {
  round: Round;
  index: number;
  onAnswerChange: (v: string) => void;
  onCheck: () => void;
  onNext: () => void;
}) {
  const q = round.questionSet[index];
  const { template, price } = round;
  const prompt = q.prompt(template, price);
  const { decimal, tolerance, display } = q.answer(template, price);
  const explanation = q.explanation(template, price);

  const rawAnswer = round.answers[index] ?? "";
  const isChecked = !!round.checked[index];
  const parsed = parseAnswer(rawAnswer);
  const isCorrect = isChecked && parsed !== null && Math.abs(parsed - decimal) <= tolerance;

  const placeholder = q.topic === "combinatorics" ? "e.g. 84" : "e.g. 1/4 or 0.25";

  return (
    <div className="quiz-panel">
      <p className="quiz-panel-title">
        Question {index + 1} of {round.questionSet.length}
        {q.usesNotation && <span className="quiz-notation-badge">notation</span>}
      </p>
      <div className={isChecked ? (isCorrect ? "quiz-q is-correct" : "quiz-q is-wrong") : "quiz-q"}>
        <p className="quiz-q-topic">{q.topicLabel}</p>
        <p className="quiz-q-prompt">{prompt}</p>
        <div className="quiz-q-input-row">
          <input
            type="text"
            className="quiz-q-input"
            placeholder={placeholder}
            value={rawAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={isChecked}
          />
          {!isChecked && (
            <button type="button" className="chip-btn" onClick={onCheck} disabled={!rawAnswer}>
              Check
            </button>
          )}
        </div>
        {isChecked && (
          <p className={isCorrect ? "quiz-q-explain is-correct" : "quiz-q-explain is-wrong"}>
            {isCorrect ? "✓ Correct. " : `✗ Not quite - the answer is ${display}. `}
            {explanation}
          </p>
        )}
      </div>
      {isChecked && (
        <button type="button" className="continue-btn" onClick={onNext}>
          Next question
        </button>
      )}
    </div>
  );
}
