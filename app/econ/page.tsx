import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import PixelTileIcon from "../PixelTileIcon";

export const metadata: Metadata = {
  title: "Economic Consulting - Outcry",
  description: "Causal inference, damages, and competition analysis.",
};

const games = [
  {
    href: "/econ/causal-confounder",
    title: "The Causal Confounder",
    tag: "Causal inference",
    description:
      "Build a difference-in-differences estimate, test parallel trends, and find the one confounder that contaminates the damages figure.",
    tone: "blue" as const,
    icon: "chart" as const,
  },
  {
    href: "/econ/antitrust",
    title: "The Antitrust Simulator",
    tag: "Competition",
    description:
      "Define the relevant market from cross-price elasticities, compute the HHI increase, and screen the merger against the guidelines.",
    tone: "green" as const,
    icon: "bars" as const,
  },
];

export default function EconPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">&larr; Back to home</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Economic Consulting</h1>
          <p className="pirate-story-line teasers-subtitle">
            Correlation is easy. Getting a causal number you can defend under cross-examination is not.
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
