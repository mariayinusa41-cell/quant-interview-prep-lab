import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import PixelTileIcon from "../PixelTileIcon";

export const metadata: Metadata = {
  title: "Actuarial Lab - Quant Interview Prep Lab",
  description: "Reserving, survival models, and long-horizon expectation.",
};

const games = [
  {
    href: "/actuarial/loss-triangle",
    title: "Loss Triangle Labyrinth",
    tag: "Reserving",
    description:
      "Build link ratios from a run-off triangle, project ultimates, and know when chain ladder breaks and Bornhuetter-Ferguson takes over.",
    icon: "calculator" as const,
  },
  {
    href: "/actuarial/survival-run",
    title: "Survival Run",
    tag: "Life contingencies",
    description:
      "Clear one mortality hurdle per year, compound the survival probability, price the annuity, then watch a medical breakthrough blow a hole in your reserves.",
    icon: "walk" as const,
  },
];

export default function ActuarialPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">&larr; Back to home</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Quant Interview Prep Lab</p>
          <h1 className="pirate-story-line teasers-title">Actuarial Lab</h1>
          <p className="pirate-story-line teasers-subtitle">
            Money owed on claims that already happened, and lives priced decades ahead.
          </p>
          <div className="lab-link-list">
            {games.map((g) => (
              <a href={g.href} className="lab-link-row" key={g.href}>
                <span className="teaser-tile-icon" aria-hidden="true"><PixelTileIcon kind={g.icon} /></span>
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
