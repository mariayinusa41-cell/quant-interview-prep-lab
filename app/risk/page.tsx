import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import PixelTileIcon from "../PixelTileIcon";

export const metadata: Metadata = {
  title: "Risk Lab - Outcry",
  description: "Tail risk, loss distributions, and what breaks under stress.",
};

const games = [
  {
    href: "/risk/tail-risk",
    title: "Tail Risk Stress Tester",
    tag: "VaR & ES",
    description:
      "Price a portfolio's risk, watch correlations converge to 1, then measure the loss beyond VaR instead of the edge of it.",
    tone: "blue" as const,
    icon: "chart" as const,
  },
];

export default function RiskPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">&larr; Back to home</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Risk Lab</h1>
          <p className="pirate-story-line teasers-subtitle">
            Nobody is paid here to forecast the mean. The whole job is the left tail.
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
