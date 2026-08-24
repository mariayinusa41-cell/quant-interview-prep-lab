"use client";

import { useState } from "react";
import {
  LATENCY_BUDGET,
  runOrderBook,
  type BookRunResult,
  type ScriptStep,
} from "../runOrderBook";
import { AccessStartButton } from "../../access/TokenPlayButton";
import { useProgress } from "../../progress/ProgressContext";
import { useSound } from "../../audio/SoundProvider";

// Answer key derived from a reference implementation and checked by hand:
// price-time priority, fills print at the resting (maker) price, a cancelled
// order must be invisible to later matching.
const SCRIPT: ScriptStep[] = [
  { op: "add", label: "Rest SELL a1 — 5 @ 101", id: "a1", side: "sell", price: 101, qty: 5, expected: [] },
  { op: "add", label: "Rest SELL a2 — 3 @ 101 (behind a1)", id: "a2", side: "sell", price: 101, qty: 3, expected: [] },
  { op: "add", label: "Rest SELL a3 — 10 @ 102", id: "a3", side: "sell", price: 102, qty: 10, expected: [] },
  { op: "add", label: "BUY b1 — 4 @ 100 does not cross", id: "b1", side: "buy", price: 100, qty: 4, expected: [] },
  {
    op: "add",
    label: "BUY b2 — 6 @ 101 sweeps a1 then a2",
    id: "b2", side: "buy", price: 101, qty: 6,
    expected: [
      { price: 101, qty: 5, maker: "a1", taker: "b2" },
      { price: 101, qty: 1, maker: "a2", taker: "b2" },
    ],
  },
  { op: "cancel", label: "Cancel a2 (2 left resting)", id: "a2", expected: true },
  { op: "cancel", label: "Cancel a2 again — already gone", id: "a2", expected: false },
  { op: "cancel", label: "Cancel an unknown id", id: "zz", expected: false },
  {
    op: "add",
    label: "BUY b3 — 5 @ 102 must skip cancelled a2",
    id: "b3", side: "buy", price: 102, qty: 5,
    expected: [{ price: 102, qty: 5, maker: "a3", taker: "b3" }],
  },
  { op: "bestBid", label: "Best bid is 100", expected: 100 },
  { op: "bestAsk", label: "Best ask is 102", expected: 102 },
];

const STARTER = `// Limit order book with price-time priority.
//
//   add(id, side, price, qty) -> array of trades
//        side is "buy" or "sell"
//        a trade is { price, qty, maker, taker }
//        fills print at the RESTING order's price
//        unfilled quantity rests in the book
//   cancel(id) -> true if it was removed, false if unknown/already gone
//   bestBid() / bestAsk() -> price, or null if that side is empty
//
// The feed will hammer cancels. Make cancel O(1).

function createBook() {
  const levels = new Map();   // price -> array of resting orders

  function restingList(side, price) {
    const key = side + ":" + price;
    if (!levels.has(key)) levels.set(key, []);
    return levels.get(key);
  }

  return {
    add(id, side, price, qty) {
      const trades = [];
      // TODO: match against the opposite side before resting the remainder
      restingList(side, price).push({ id, side, price, qty });
      return trades;
    },

    cancel(id) {
      // TODO: make this O(1)
      for (const arr of levels.values()) {
        const i = arr.findIndex((o) => o.id === id);
        if (i >= 0) { arr.splice(i, 1); return true; }
      }
      return false;
    },

    bestBid() { return null; },
    bestAsk() { return null; },
  };
}
`;

const SOLUTION = `function createBook() {
  const bids = new Map(), asks = new Map();  // price -> FIFO array
  const index = new Map();                   // id -> order  (this is the O(1) cancel)
  const sideBook = (s) => (s === "buy" ? bids : asks);

  const prune = (arr) => { while (arr.length && (arr[0].cancelled || arr[0].qty === 0)) arr.shift(); };

  function rest(o) {
    const m = sideBook(o.side);
    if (!m.has(o.price)) m.set(o.price, []);
    m.get(o.price).push(o);
    index.set(o.id, o);
  }

  return {
    add(id, side, price, qty) {
      const trades = [];
      const opp = side === "buy" ? asks : bids;
      const order = (a, b) => (side === "buy" ? a - b : b - a);
      let remaining = qty;

      while (remaining > 0) {
        let hit = null;
        for (const p of [...opp.keys()].sort(order)) {
          const arr = opp.get(p); prune(arr);
          if (!arr.length) { opp.delete(p); continue; }
          if (side === "buy" ? p > price : p < price) break;  // no longer crosses
          hit = p; break;
        }
        if (hit === null) break;

        const arr = opp.get(hit); prune(arr);
        if (!arr.length) { opp.delete(hit); continue; }
        const maker = arr[0];
        const q = Math.min(remaining, maker.qty);
        maker.qty -= q; remaining -= q;
        trades.push({ price: hit, qty: q, maker: maker.id, taker: id });
        if (maker.qty === 0) { arr.shift(); index.delete(maker.id); }
        if (!arr.length) opp.delete(hit);
      }

      if (remaining > 0) rest({ id, side, price, qty: remaining, cancelled: false });
      return trades;
    },

    // O(1): one map lookup and a tombstone. No scan, no splice — splice is
    // still O(N) even when a map told you exactly where to look.
    cancel(id) {
      const o = index.get(id);
      if (!o || o.cancelled) return false;
      o.cancelled = true; o.qty = 0; index.delete(id);
      return true;
    },

    bestBid() {
      for (const p of [...bids.keys()].sort((a, b) => b - a)) {
        const arr = bids.get(p); prune(arr);
        if (arr.length) return p;
      }
      return null;
    },
    bestAsk() {
      for (const p of [...asks.keys()].sort((a, b) => a - b)) {
        const arr = asks.get(p); prune(arr);
        if (arr.length) return p;
      }
      return null;
    },
  };
}
`;

type Phase = "brief" | "build";

export default function OrderBookGame() {
  const { recordAttempt } = useProgress();
  const { playSfx, startMusic } = useSound();

  const [phase, setPhase] = useState<Phase>("brief");
  const [code, setCode] = useState(STARTER);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BookRunResult | null>(null);
  const [revealed, setRevealed] = useState(false);

  const start = () => { setPhase("build"); startMusic("game"); };

  async function run() {
    if (running) return;
    setRunning(true);
    setResult(null);
    const r = await runOrderBook(code, SCRIPT);
    setResult(r);
    setRunning(false);

    const correctness = r.cases.length > 0 && r.cases.every((c) => c.passed);
    recordAttempt("data-structures", correctness ? "correct" : "incorrect");
    // Latency is graded separately — a correct-but-slow engine is exactly the
    // failure mode this module exists to catch.
    if (correctness) {
      recordAttempt("complexity", r.latencyPassed ? "correct" : "incorrect");
    }
    playSfx(correctness && r.latencyPassed ? "correct" : "wrong");
  }

  function reveal() {
    if (revealed) return;
    setRevealed(true);
    setCode(SOLUTION);
    // Looking up the answer costs accuracy but earns nothing, same as anywhere.
    recordAttempt("data-structures", "revealed");
  }

  if (phase === "brief") {
    return (
      <div className="answer-content" style={{ padding: 0 }}>
        <div className="pixel-stage lab-briefing">
          <p className="quiz-panel-title">Build the book. Then survive the cancel storm.</p>
          <p>
            An exchange matching engine sees far more cancels than fills — most resting orders never
            trade. Getting the matching logic right is table stakes; the interview is really about
            what your <code>cancel</code> costs.
          </p>
          <div className="lab-topic-grid">
            {[
              ["PRICE-TIME", "best price, then oldest"],
              ["PARTIAL FILLS", "rest the remainder"],
              ["O(1) CANCEL", "no scanning"],
              ["TOMBSTONES", "delete lazily"],
            ].map(([t, s]) => <div key={t}><strong>{t}</strong><span>{s}</span></div>)}
          </div>
          <p className="mm-step-hint">
            Interview lens: nearly everyone writes a working book. The follow-up — &ldquo;now cancel
            is on the hot path, what does it cost you?&rdquo; — is what separates candidates.
          </p>
          <AccessStartButton
            gameId="quantdev-order-book"
            title="The Order Book Engine"
            defaultLabel="Open the editor"
            className="continue-btn"
            onStart={start}
          >
            Open the editor
          </AccessStartButton>
        </div>
      </div>
    );
  }

  const allPassed = !!result && result.cases.length > 0 && result.cases.every((c) => c.passed);

  return (
    <div className="answer-content" style={{ padding: 0 }}>
      <div className="lab-hud">
        <span>SPEC <strong>{SCRIPT.length} checks</strong></span>
        <span>BUDGET <strong>&le;{LATENCY_BUDGET}x ref</strong></span>
        {result?.ratio !== undefined && (
          <span className={result.latencyPassed ? "risk-regime" : "risk-regime is-crisis"}>
            {result.ratio.toFixed(1)}x
          </span>
        )}
      </div>

      <textarea
        className="algo-code-editor ob-editor"
        value={code}
        spellCheck={false}
        onChange={(e) => setCode(e.target.value)}
        aria-label="Order book implementation"
      />

      <div className="algo-mini-actions">
        <button type="button" className="calc-submit-btn" onClick={run} disabled={running}>
          {running ? "Running feed…" : "Run the feed"}
        </button>
        <button type="button" className="chip-btn" onClick={reveal} disabled={revealed}>
          {revealed ? "Solution shown" : "Reveal solution"}
        </button>
        <button type="button" className="chip-btn" onClick={() => { setCode(STARTER); setResult(null); }}>
          Reset
        </button>
      </div>

      {result?.crashed && (
        <p className="quiz-q-explain is-wrong">
          {result.timedOut ? "Timed out. " : "Crashed. "}{result.crashMessage}
        </p>
      )}

      {result && !result.crashed && (
        <>
          <div className="ob-results">
            {result.cases.map((c, i) => (
              <div className={c.passed ? "ob-case is-pass" : "ob-case is-fail"} key={i}>
                <span className="ob-case-mark">{c.passed ? "PASS" : "FAIL"}</span>
                <span className="ob-case-label">{c.label}</span>
                {!c.passed && (
                  <span className="ob-case-diff">
                    expected <code>{c.expected}</code> · got <code>{c.actual}</code>
                  </span>
                )}
              </div>
            ))}
          </div>

          {allPassed && result.ratio !== undefined && (
            <div className={result.latencyPassed ? "ob-latency is-pass" : "ob-latency is-fail"}>
              <p className="did-trends-title">
                {result.latencyPassed ? "Latency gate cleared" : "Latency gate failed"}
              </p>
              <div className="ob-latency-row">
                <span>Your engine</span><strong>{result.candidateMs?.toFixed(2)} ms</strong>
              </div>
              <div className="ob-latency-row">
                <span>Reference O(1)</span><strong>{result.referenceMs?.toFixed(2)} ms</strong>
              </div>
              <div className="ob-latency-row is-total">
                <span>Ratio</span><strong>{result.ratio.toFixed(1)}x</strong>
              </div>
              <p className="tri-note">
                6,000 resting orders, then every one cancelled. Measured against a reference
                implementation run in this same worker, so a slow machine moves both numbers
                together rather than changing the verdict.
              </p>
              {!result.latencyPassed && (
                <p className="quiz-q-explain is-wrong">
                  The book is correct but the cancel path is not constant time. A hash map from id
                  to order is only half the fix — <code>splice</code> still shifts every element
                  after the one you removed. Mark the order dead and skip it while matching instead.
                </p>
              )}
              {result.latencyPassed && (
                <p className="quiz-q-explain is-correct">
                  Correct and constant-time. Cancels no longer touch the size of the book, which is
                  the property that keeps a real engine alive during a cancel/replace storm.
                </p>
              )}
            </div>
          )}

          {allPassed && result.latencyPassed && (
            <AccessStartButton
              gameId="quantdev-order-book"
              title="The Order Book Engine"
              defaultLabel="Reset"
              className="continue-btn"
              onStart={() => { setCode(STARTER); setResult(null); setRevealed(false); }}
            >
              Start over from the stub
            </AccessStartButton>
          )}
        </>
      )}
    </div>
  );
}
