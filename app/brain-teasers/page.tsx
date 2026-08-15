import type { Metadata } from "next";
import DarkMode from "./DarkMode";
import { ChestTileIcon, TigerTileIcon } from "./TeaserIcons";

export const metadata: Metadata = {
  title: "Brain Teasers - Quant Interview Prep Lab",
  description: "Playable brain teasers, worked out step by step.",
};

const teasers = [
  {
    href: "/brain-teasers/screwy-pirates",
    title: "Screwy Pirates",
    tag: "Game theory",
    description: "Five pirates, a hundred gold coins, and a vote that decides who walks the plank.",
    Icon: ChestTileIcon,
  },
  {
    href: "/brain-teasers/tiger-and-sheep",
    title: "Tiger and Sheep",
    tag: "Induction",
    description: "A hundred tigers, one sheep, and a rule that turns any eater into the next meal.",
    Icon: TigerTileIcon,
  },
];

export default function BrainTeasersPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">
          &larr; Back to home
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Quant Interview Prep Lab</p>
          <h1 className="pirate-story-line teasers-title">Brain Teasers</h1>
          <p className="pirate-story-line teasers-subtitle">
            Pick a teaser to play through — the story, the mechanics, and the actual answer, step by step.
          </p>

          <div className="teaser-tile-grid">
            {teasers.map((teaser) => (
              <a href={teaser.href} className="teaser-tile" key={teaser.href}>
                <span className="teaser-tile-icon" aria-hidden="true">
                  <teaser.Icon />
                </span>
                <span className="teaser-tile-tag">{teaser.tag}</span>
                <span className="teaser-tile-title">{teaser.title}</span>
                <span className="teaser-tile-desc">{teaser.description}</span>
                <span className="teaser-tile-cta">Play &rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
