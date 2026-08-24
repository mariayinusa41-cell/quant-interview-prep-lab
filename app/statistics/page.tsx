import type { Metadata } from "next";
import DarkMode from "./DarkMode";
import PixelTileIcon from "../PixelTileIcon";

export const metadata: Metadata = {
  title: "Statistics - Outcry",
  description: "Signal versus noise: regression, significance, and the traps in between.",
};

const subsections = [
  {
    href: "/statistics/crack-the-bot",
    title: "Crack the Bot",
    tag: "Regression & omitted-variable bias",
    description:
      "A rival algorithm is trading against you. Reverse-engineer its rule from the tape, then control for the confounders before you trust a t-stat.",
    tone: "blue" as const,
    icon: "search" as const,
  },
  {
    href: "/statistics/distributions",
    title: "Read the Shape",
    tag: "Distributions & CLT",
    description:
      "Six distributions, one histogram, and a clock. Name what's generating the data, then prove it with the moments.",
    tone: "green" as const,
    icon: "bars" as const,
  },
  {
    href: "/statistics/backtests",
    title: "Twenty Backtests",
    tag: "Selection bias",
    description:
      "Twenty strategies, one beautiful equity curve. Work out whether it's real edge or the best of twenty coin flips.",
    tone: "violet" as const,
    icon: "chart" as const,
  },
];

export default function StatisticsPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">
          &larr; Back to home
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Statistics</h1>
          <p className="pirate-story-line teasers-subtitle">
            Probability asks what a known model produces. Statistics asks what model produced the data — and whether
            you&apos;re fooling yourself.
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
