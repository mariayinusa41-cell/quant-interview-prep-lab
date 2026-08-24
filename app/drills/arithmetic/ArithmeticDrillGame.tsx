"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABEL, buildDeck, randomSeed, type DrillProblem } from "./arithmeticMath";
import { ResultBanner } from "../../probability/quitters-never-lose/lottery/pick/PixelArt";

// Flashcard race. A fixed deck is dealt one card at a time and BOTH racers
// see the same card (the deck is rebuilt from a shared seed, so a ghost
// recorded days ago replays the identical sequence). First to answer takes
// the card and it flips away immediately — there is no second attempt, and
// a wrong answer forfeits the card the same as being beaten to it.
//
// Deck size rather than a wall clock is deliberate: a fixed timer either cut
// the hard categories off mid-thought or dragged once the easy ones came up.
// A 20-card deck self-adjusts — fast play finishes fast.
const DECK_SIZE = 20;
const CARD_TIMEOUT_MS = 10000; // a card nobody claims expires, so one stumper can't stall the race
const FLIP_MS = 620; // beat between cards, long enough to register who took it

type CardTime = { t: number; ok: boolean } | null;
type GhostRun = { id: number; score: number; seed: number; deckSize: number; cardTimes: CardTime[] };

// Older rows stored a bare number per card (ms, or -1 for never). Accept both
// shapes so previously recorded ghosts stay raceable instead of erroring.
function normalizeCardTimes(raw: unknown): CardTime[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => {
    if (typeof e === "number") return e < 0 ? null : { t: e, ok: true };
    if (e && typeof e === "object" && typeof (e as { t?: unknown }).t === "number") {
      const entry = e as { t: number; ok?: boolean };
      return { t: entry.t, ok: entry.ok !== false };
    }
    return null;
  });
}
type Phase = "setup" | "racing" | "resolved";
type Mode = "solo" | "ghost";
type CardOutcome = "you" | "ghost" | "missed" | "wrong";

export default function ArithmeticDrillGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("solo");
  const [ghostRun, setGhostRun] = useState<GhostRun | null>(null);
  const [setupMsg, setSetupMsg] = useState("");
  const [loadingGhost, setLoadingGhost] = useState(false);

  const [seed, setSeed] = useState(0);
  const [deck, setDeck] = useState<DrillProblem[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [input, setInput] = useState("");
  const [yourScore, setYourScore] = useState(0);
  const [ghostScore, setGhostScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [flip, setFlip] = useState<CardOutcome | null>(null); // set while a card is flipping away
  const [savedRunId, setSavedRunId] = useState<number | null>(null);
  const [cardClock, setCardClock] = useState(0);
  const [ghostFumbled, setGhostFumbled] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const cardStartedAt = useRef(0);
  const runStartedAt = useRef(0);
  // Written synchronously on every resolution so the timers/POST always read
  // current values instead of a stale render closure.
  const cardTimesRef = useRef<CardTime[]>([]);
  const yourScoreRef = useRef(0);
  const attemptsRef = useRef(0);
  // setFlip is async, so the 60ms interval would otherwise fire again and
  // re-resolve the SAME card before React tears it down — inflating scores
  // and skipping cards. This latch closes synchronously on first resolution.
  const cardResolvedRef = useRef(false);
  const ghostMissAppliedRef = useRef(false);

  const ghostEntryFor = (i: number): CardTime => (ghostRun ? ghostRun.cardTimes[i] ?? null : null);

  // Advance past a resolved card after a short flip beat.
  useEffect(() => {
    if (phase !== "racing" || flip === null) return;
    const t = window.setTimeout(() => {
      setFlip(null);
      setInput("");
      const next = cardIndex + 1;
      if (next >= deck.length) {
        finishRun();
      } else {
        setCardIndex(next);
        cardStartedAt.current = Date.now();
        cardResolvedRef.current = false;
        ghostMissAppliedRef.current = false;
        setGhostFumbled(false);
        setCardClock(0);
      }
    }, FLIP_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip, phase, cardIndex, deck.length]);

  // Live card clock: drives the countdown bar, the ghost stealing the card,
  // and the timeout backstop.
  useEffect(() => {
    if (phase !== "racing" || flip !== null) return;
    const t = window.setInterval(() => {
      const onCard = Date.now() - cardStartedAt.current;
      setCardClock(onCard);

      const ghost = ghostEntryFor(cardIndex);
      if (ghost && ghost.t <= onCard) {
        if (ghost.ok) {
          resolveCard("ghost");
          return;
        }
        // Opponent buzzed in wrong: they eat the penalty, but the card is
        // still live for you — same as someone shouting a bad answer first.
        if (!ghostMissAppliedRef.current) {
          ghostMissAppliedRef.current = true;
          setGhostScore((g) => g - 1);
          setGhostFumbled(true);
        }
      }
      if (onCard >= CARD_TIMEOUT_MS) resolveCard("missed");
    }, 60);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, flip, cardIndex, ghostRun]);

  useEffect(() => {
    if (phase === "racing" && flip === null) inputRef.current?.focus();
  }, [phase, flip, cardIndex]);

  const resolveCard = (outcome: CardOutcome) => {
    if (cardResolvedRef.current) return;
    cardResolvedRef.current = true;
    const onCard = Date.now() - cardStartedAt.current;

    // Only a real attempt gets recorded; a timeout leaves the slot null so a
    // future racer sees "they never answered this one" rather than a fumble.
    if (outcome === "you") cardTimesRef.current[cardIndex] = { t: onCard, ok: true };
    else if (outcome === "wrong") cardTimesRef.current[cardIndex] = { t: onCard, ok: false };
    else cardTimesRef.current[cardIndex] = null;

    if (outcome === "you") {
      yourScoreRef.current += 1;
      setYourScore(yourScoreRef.current);
    } else if (outcome === "wrong") {
      yourScoreRef.current -= 1;
      setYourScore(yourScoreRef.current);
    } else if (outcome === "ghost") {
      setGhostScore((g) => g + 1);
    }
    setFlip(outcome);
  };

  const chooseGhost = async () => {
    setMode("ghost");
    setLoadingGhost(true);
    setSetupMsg("");
    try {
      const res = await fetch(`/api/drills/runs/random${savedRunId ? `?excludeId=${savedRunId}` : ""}`);
      const data = (await res.json()) as {
        run: { id: number; score: number; seed: number; deckSize: number; cardTimesJson: string } | null;
        error?: string;
      };
      if (data.error) {
        setSetupMsg("Couldn't reach the leaderboard — starting solo instead.");
        setMode("solo");
        setGhostRun(null);
      } else if (!data.run) {
        setSetupMsg("No one has set a run yet — play solo and you'll become the first ghost.");
        setMode("solo");
        setGhostRun(null);
      } else {
        setGhostRun({
          id: data.run.id,
          score: data.run.score,
          seed: data.run.seed,
          deckSize: data.run.deckSize,
          cardTimes: normalizeCardTimes(JSON.parse(data.run.cardTimesJson)),
        });
      }
    } catch {
      setSetupMsg("Couldn't reach the leaderboard — starting solo instead.");
      setMode("solo");
      setGhostRun(null);
    } finally {
      setLoadingGhost(false);
    }
  };

  const start = () => {
    // Racing a ghost means racing ITS deck — same seed, same cards, same order.
    const runSeed = ghostRun ? ghostRun.seed : randomSeed();
    const size = ghostRun ? ghostRun.deckSize || DECK_SIZE : DECK_SIZE;
    setSeed(runSeed);
    setDeck(buildDeck(runSeed, size));
    cardTimesRef.current = new Array(size).fill(null);
    yourScoreRef.current = 0;
    attemptsRef.current = 0;
    setCardIndex(0);
    setYourScore(0);
    setGhostScore(0);
    setAttempts(0);
    setInput("");
    setFlip(null);
    setSavedRunId(null);
    setCardClock(0);
    runStartedAt.current = Date.now();
    cardStartedAt.current = Date.now();
    cardResolvedRef.current = false;
    ghostMissAppliedRef.current = false;
    setGhostFumbled(false);
    setPhase("racing");
  };

  const finishRun = () => {
    setPhase("resolved");
    const durationMs = Date.now() - runStartedAt.current;
    fetch("/api/drills/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "arithmetic-race",
        durationMs,
        score: yourScoreRef.current,
        attempts: attemptsRef.current,
        splits: cardTimesRef.current.filter((e): e is { t: number; ok: boolean } => !!e && e.ok).map((e) => e.t),
        seed,
        deckSize: deck.length,
        cardTimes: cardTimesRef.current,
      }),
    })
      .then((res) => res.json())
      .then((data: { run?: { id: number } }) => {
        if (data.run) setSavedRunId(data.run.id);
      })
      .catch(() => {});
  };

  const submit = () => {
    if (phase !== "racing" || flip !== null || !input.trim()) return;
    const card = deck[cardIndex];
    if (!card) return;
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    // One shot per card: a wrong answer forfeits it exactly like being beaten
    // to it. That's what makes answering fast a real risk, not a free reroll.
    resolveCard(card.checkAnswer(input) ? "you" : "wrong");
  };

  const playAgain = () => {
    setPhase("setup");
    setSetupMsg("");
  };

  const card = deck[cardIndex];
  const cardsLeft = deck.length - cardIndex;
  const timeoutPct = Math.max(0, Math.min(100, 100 - (cardClock / CARD_TIMEOUT_MS) * 100));
  const ghostNow = ghostEntryFor(cardIndex);
  const ghostPressurePct =
    ghostNow && ghostNow.ok ? Math.max(0, Math.min(100, (cardClock / ghostNow.t) * 100)) : 0;
  const outcome = ghostRun ? (yourScore > ghostScore ? "win" : yourScore < ghostScore ? "loss" : "tie") : null;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Quant Interview Prep Lab</p>
      <h1 className="pirate-story-line answer-title">Arithmetic Drill</h1>
      <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
        {DECK_SIZE} cards, one at a time. Take a card first and it's <strong>+1</strong> — answer wrong and it's{" "}
        <strong>−1</strong> and gone. One shot per card, so don't buzz until you're sure.
      </p>

      {phase === "setup" && (
        <div className="pixel-stage">
          {setupMsg && (
            <p className="qty-hint" style={{ marginBottom: 12 }}>
              {setupMsg}
            </p>
          )}
          <div className="answer-crew-picker" style={{ marginBottom: 18 }}>
            <button
              type="button"
              className={mode === "solo" ? "chip-btn active" : "chip-btn"}
              onClick={() => {
                setMode("solo");
                setGhostRun(null);
                setSetupMsg("");
              }}
            >
              Solo
            </button>
            <button
              type="button"
              className={mode === "ghost" && ghostRun ? "chip-btn active" : "chip-btn"}
              disabled={loadingGhost}
              onClick={chooseGhost}
            >
              {loadingGhost ? "Finding an opponent..." : "Race someone"}
            </button>
          </div>
          {mode === "ghost" && ghostRun && (
            <p className="qty-hint" style={{ marginBottom: 12 }}>
              Racing a real run that took {ghostRun.score} of {ghostRun.deckSize || DECK_SIZE} cards. You'll get the exact
              same deck they did.
            </p>
          )}
          <button type="button" className="continue-btn" onClick={start}>
            Start
          </button>
        </div>
      )}

      {phase === "racing" && card && (
        <div className="pixel-stage">
          <div className="drill-score-row">
            <div className="drill-score-tile">
              <span className="drill-score-label">YOU</span>
              <span className={yourScore < 0 ? "drill-score-value is-negative" : "drill-score-value is-you"}>{yourScore}</span>
            </div>
            <div className="drill-score-tile">
              <span className="drill-score-label">CARDS LEFT</span>
              <span className="drill-score-value">{cardsLeft}</span>
            </div>
            {ghostRun && (
              <div className="drill-score-tile">
                <span className="drill-score-label">OPPONENT</span>
                <span className={ghostScore < 0 ? "drill-score-value is-negative" : "drill-score-value is-ghost"}>
                  {ghostScore}
                </span>
              </div>
            )}
          </div>

          {/* Two bars: how long before the card expires, and (when racing) how
              close the opponent is to snatching this exact card. */}
          <div className="drill-timer-bar">
            <div className="drill-timer-fill" style={{ width: `${timeoutPct}%` }} />
          </div>
          {ghostRun && (
            <div className="drill-ghost-bar">
              <div className="drill-ghost-fill" style={{ width: `${ghostPressurePct}%` }} />
            </div>
          )}

          {ghostFumbled && flip === null && (
            <p className="drill-fumble-flash">OPPONENT ANSWERED WRONG · −1 · CARD STILL LIVE</p>
          )}

          <div className={flip ? `drill-card is-flip-${flip}` : "drill-card"}>
            {flip ? (
              <p className="drill-card-verdict">
                {flip === "you"
                  ? "TAKEN BY YOU  +1"
                  : flip === "ghost"
                    ? "OPPONENT TOOK IT"
                    : flip === "wrong"
                      ? "WRONG  −1"
                      : "TIME UP"}
                <span className="drill-card-answer">{card.correctDisplay}</span>
              </p>
            ) : (
              <>
                <p className="drill-category-badge">{CATEGORY_LABEL[card.category]}</p>
                <p className="drill-prompt">{card.prompt}</p>
              </>
            )}
          </div>

          <div className="quiz-q-input-row" style={{ justifyContent: "center" }}>
            <input
              ref={inputRef}
              type="text"
              className="quiz-q-input drill-input"
              placeholder="answer, press Enter"
              value={input}
              autoFocus
              disabled={flip !== null}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </div>
        </div>
      )}

      {phase === "resolved" && (
        <div className="pixel-stage">
          {outcome ? (
            <ResultBanner
              outcome={outcome === "loss" ? "loss" : "win"}
              title={outcome === "win" ? "YOU WIN" : outcome === "loss" ? "OPPONENT WINS" : "TIE"}
              sub={`You took ${yourScore} cards — opponent took ${ghostScore} of ${deck.length}`}
            />
          ) : (
            <ResultBanner
              outcome="win"
              title="DECK CLEARED"
              sub={`You took ${yourScore} of ${deck.length} cards in ${attempts} attempts`}
            />
          )}
          <button type="button" className="chip-btn" style={{ marginTop: 16 }} onClick={playAgain}>
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
