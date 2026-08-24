import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import PixelTileIcon from "../PixelTileIcon";

export const metadata: Metadata = {
  title: "Quant Dev Lab - Outcry",
  description: "Exchange infrastructure, data structures, and latency.",
};

const games = [
  {
    href: "/quantdev/order-book",
    title: "The Order Book Engine",
    tag: "Data structures",
    description:
      "Write a real matching engine with price-time priority, then survive a cancel storm your implementation is timed against.",
    tone: "blue" as const,
    icon: "sequence" as const,
  },
  {
    href: "/quantdev/concurrency",
    title: "Concurrency Clash",
    tag: "Concurrency",
    description:
      "Four C++ snippets that compile and still break: a data race, a lost wakeup, a relaxed publish, and a deadlock. Find the line, pick the fix.",
    tone: "green" as const,
    icon: "calculator" as const,
  },
];

export default function QuantDevPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">&larr; Back to home</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Quant Dev Lab</h1>
          <p className="pirate-story-line teasers-subtitle">
            Infrastructure questions, where the right answer is measured rather than argued.
          </p>
          <div className="lab-link-list">
            {games.map((g) => (
              <a href={g.href} className="lab-link-row" key={g.href}>
                <span className="teaser-tile-icon" aria-hidden="true"><PixelTileIcon kind={g.icon} tone={g.tone} /></span>
                <span className="teaser-tile-tag">{g.tag}</span>
                <span className="teaser-tile-title">{g.title}</span>
                <span className="teaser-tile-desc">{g.description}</span>
                <span className="teaser-tile-cta">Play &rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
