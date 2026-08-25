import type { Metadata } from "next";
import DarkMode from "./DarkMode";
import PixelTileIcon from "../PixelTileIcon";

export const metadata: Metadata = {
  title: "Finance - Outcry",
  description: "Interactive finance simulations.",
};

const subsections = [
  {
    href: "/finance/market-maker",
    title: "Market Maker",
    tag: "Adverse selection",
    description: "Quote a bid/ask spread each round and see who trades against you - noise flow or informed flow.",
    tone: "blue" as const,
    icon: "candles" as const,
  },
  {
    href: "/finance/delta-defender",
    title: "Delta Defender",
    tag: "Options & Greeks",
    description: "You sold a call. Hedge it live against real Black-Scholes Greeks as the stock moves under geometric Brownian motion.",
    tone: "green" as const,
    icon: "candles" as const,
  },
  {
    href: "/finance/basket-arbitrage",
    title: "Basket Arbitrage",
    tag: "Multi-leg hedging",
    description: "Two cards, same commodity, different bundle size. Buy and sell across them until every exposure nets to zero - then it gets harder.",
    tone: "violet" as const,
    icon: "bars" as const,
  },
];

export default function FinancePage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">
          &larr; Back to home
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Finance</h1>
          <p className="pirate-story-line teasers-subtitle">
            Interactive simulations for the finance chapter - trade it out, don't just read the theory.
          </p>

          <div className="lab-link-list">
            {subsections.map((s) => (
              <a href={s.href} className="lab-link-row" key={s.href}>
                <span className="teaser-tile-icon" aria-hidden="true" style={{ fontSize: "1.8rem" }}>
                  <PixelTileIcon kind={s.icon} tone={s.tone} />
                </span>
                <span className="teaser-tile-tag">{s.tag}</span>
                <span className="teaser-tile-title">{s.title}</span>
                <span className="teaser-tile-desc">{s.description}</span>
                <span className="teaser-tile-cta">Play &rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
