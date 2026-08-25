import type { Metadata } from "next";
import DarkMode from "./DarkMode";
import PixelTileIcon from "../PixelTileIcon";
import { CherrySlotIcon } from "./quitters-never-lose/PixelIcons";

export const metadata: Metadata = {
  title: "Probability - Outcry",
  description: "Interactive probability simulations.",
};

const subsections = [
  {
    href: "/probability/quitters-never-lose",
    title: "Quitters Never Lose",
    tag: "Gambler's ruin",
    description: "Pick a game, play it out, and watch what a real bankroll does over time.",
    tone: "blue" as const,
    icon: "cherry" as const,
  },
  {
    href: "/stochastic-processes",
    title: "Ruin Walker",
    tag: "Markov chains",
    description: "Choose small steps or volatile jumps, then decide when to stop before the walk hits ruin.",
    tone: "green" as const,
    icon: "walk" as const,
  },
];

export default function ProbabilityPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">
          &larr; Back to home
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Probability</h1>
          <p className="pirate-story-line teasers-subtitle">
            Interactive simulations for the probability chapter - play them out, don't just read the theory.
          </p>

          <div className="lab-link-list">
            {subsections.map((s) => (
              <a href={s.href} className="lab-link-row" key={s.href}>
                <span className="teaser-tile-icon" aria-hidden="true" style={{ fontSize: "1.8rem" }}>
                  {s.icon === "cherry" ? <CherrySlotIcon className="pixel-tile-icon" /> : <PixelTileIcon kind={s.icon} tone={s.tone} />}
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
