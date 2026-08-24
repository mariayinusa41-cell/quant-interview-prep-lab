"use client";

import { useState } from "react";

// Worked-example tutorial: every term is introduced with the actual numbers
// it produces, shown on a mini quote board, instead of being defined in the
// abstract. The board updates per step so "skew +1" is something you SEE
// move the two prices, not a word you have to hold in your head.

type Step = {
  term: string;
  body: string;
  bid?: number;
  ask?: number;
  fair?: number;
  highlight?: "bid" | "ask" | "both" | "fair" | null;
  note?: string;
};

const STEPS: Step[] = [
  {
    term: "The job",
    body: "You're a market maker. Your job isn't to guess where the price is going — it's to stand in the middle and trade with whoever shows up, buying a little cheap and selling a little rich.",
    fair: 100,
    highlight: "fair",
    note: "Everything below builds on this one screen.",
  },
  {
    term: "Tick",
    body: "A tick is just the smallest step a price can move — think of it as one cent. When this game says \"2 ticks\", it means 2 cents. That's the only unit used here.",
    fair: 100,
    highlight: "fair",
    note: "100 → 101 is a one-tick move.",
  },
  {
    term: "Fair value",
    body: "FAIR is what the thing is genuinely worth this second. It drifts up and down on its own during the game. You never trade AT fair — it's just the reference point you quote around.",
    fair: 100,
    highlight: "fair",
  },
  {
    term: "Bid & Ask",
    body: "You must always post two prices. Your BID is what you'll BUY at — below fair. Your ASK is what you'll SELL at — above fair. Buy low, sell high; the gap between them is where your profit lives.",
    bid: 98,
    fair: 100,
    ask: 102,
    highlight: "both",
    note: "Someone selling to you hits your bid. Someone buying from you lifts your ask.",
  },
  {
    term: "Half-spread",
    body: "How far each side sits from fair. Half-spread 2 puts your bid 2 below and your ask 2 above. Wider earns more per trade — but a worse price means fewer people take it, so you trade less often.",
    bid: 98,
    fair: 100,
    ask: 102,
    highlight: "both",
    note: "Half-spread 1 would be 99 / 101. Half-spread 4 would be 96 / 104.",
  },
  {
    term: "Skew",
    body: "Skew slides BOTH prices the same direction without changing the gap. Skew +1 lifts your bid to 99 and your ask to 103 — you're now keener to buy and pricier to sell. Skew down does the reverse.",
    bid: 99,
    fair: 100,
    ask: 103,
    highlight: "both",
    note: "Same 2-tick half-spread as before, just shifted up 1.",
  },
  {
    term: "Inventory",
    body: "Whatever you're left holding. Buy one and you're +1 (long). Sell one and you're −1 (short). It carries across the whole session, and holding a pile when time runs out costs you to clear — so skew to work it back toward zero.",
    bid: 99,
    fair: 100,
    ask: 103,
    highlight: null,
    note: "Long and worried? Skew down to sell more and buy less.",
  },
  {
    term: "The catch",
    body: "Most people trading with you are noise — random, harmless, you keep the spread. But some are informed: they only trade when they already know the price is about to move against you. Getting picked off by them is the real cost of doing business.",
    bid: 99,
    fair: 100,
    ask: 103,
    highlight: null,
    note: "Watch for the ORDER FLOW tip before you quote — it's a hint, not a guarantee.",
  },
  {
    term: "The reservation price",
    body: "Instead of eyeballing half-spread and skew by hand, each round you'll compute them from a real formula: r = fair − q·γ·σ²·(T−t). That's your reservation price — where you'd be indifferent to buying or selling given the inventory q you're holding. Flat inventory puts r right at fair; carrying a position pulls it toward the side that makes the position easier to unwind.",
    fair: 100,
    highlight: "fair",
    note: "γ (risk aversion) and σ (volatility) are fixed for the session; only q and time-left change round to round.",
  },
  {
    term: "Each round",
    body: "See the round's fair value and your inventory, compute r, then post — bid = r − half-spread, ask = r + half-spread, using the same optimal-spread formula. Answer one quick question about the quote you just made, then see who traded against you and what it did to your P&L.",
    bid: 99,
    fair: 100,
    ask: 103,
    highlight: "both",
  },
];

function QuoteBoard({ step }: { step: Step }) {
  const showQuote = step.bid !== undefined && step.ask !== undefined;
  return (
    <div className="mm-teach-board">
      <div className={step.highlight === "both" ? "mm-teach-tile is-bid is-lit" : "mm-teach-tile is-bid"}>
        <span className="mm-teach-label">YOUR BID</span>
        <span className="mm-teach-value">{showQuote ? step.bid : "—"}</span>
        <span className="mm-teach-sub">you buy here</span>
      </div>
      <div className={step.highlight === "fair" ? "mm-teach-tile is-fair is-lit" : "mm-teach-tile is-fair"}>
        <span className="mm-teach-label">FAIR</span>
        <span className="mm-teach-value">{step.fair ?? "—"}</span>
        <span className="mm-teach-sub">true worth</span>
      </div>
      <div className={step.highlight === "both" ? "mm-teach-tile is-ask is-lit" : "mm-teach-tile is-ask"}>
        <span className="mm-teach-label">YOUR ASK</span>
        <span className="mm-teach-value">{showQuote ? step.ask : "—"}</span>
        <span className="mm-teach-sub">you sell here</span>
      </div>
    </div>
  );
}

export default function MarketMakerIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="answer-content">
      <p className="pirate-kicker">Outcry</p>
      <h1 className="pirate-story-line answer-title">Market Maker</h1>

      <div className="pixel-stage">
        <p className="mm-teach-progress">
          {step + 1} / {STEPS.length}
        </p>

        <QuoteBoard step={current} />

        <p className="mm-teach-term">{current.term}</p>
        <div className="hs-tutorial-step">
          <p>{current.body}</p>
        </div>
        {current.note && <p className="mm-teach-note">{current.note}</p>}

        <div className="mm-teach-nav">
          {step > 0 && (
            <button type="button" className="hs-chunky-btn is-secondary" onClick={() => setStep((s) => s - 1)}>
              Back
            </button>
          )}
          {isLast ? (
            <button type="button" className="hs-chunky-btn" onClick={onDone}>
              Start trading
            </button>
          ) : (
            <button type="button" className="hs-chunky-btn" onClick={() => setStep((s) => s + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
