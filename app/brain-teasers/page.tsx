import type { Metadata } from "next";
import DarkMode from "./DarkMode";
import { ChestTileIcon, TigerTileIcon } from "./TeaserIcons";
import { TEASER_BANK } from "./story/teaserBank";
import { PixelSprite } from "./story/sprites";
import { PALETTES } from "./story/palettes";
import TokenPlayButton from "../access/TokenPlayButton";

export const metadata: Metadata = {
  title: "Brain Teasers - Outcry",
  description: "Playable brain teasers, worked out step by step.",
};

const featuredGames = [
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

const storyGames = TEASER_BANK.map((game) => ({
  href: `/brain-teasers/${game.slug}`,
  title: game.title,
  tag: game.tag,
  description: game.description,
  Icon: null,
  sprite: game.sprite,
  palette: game.palette,
}));

export default function BrainTeasersPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">
          &larr; Back to home
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Brain Teasers Lab</h1>
          <p className="pirate-story-line teasers-subtitle">
            Choose a game. The mechanics, story, and answer breakdowns live inside each playable lab.
          </p>

          <div className="lab-link-list">
            {[...featuredGames, ...storyGames].map((game) => game.title === "Screwy Pirates" ? <a href={game.href} className="lab-link-row" key={game.href}>
                <span className="teaser-tile-icon" aria-hidden="true">
                  {game.Icon ? (
                    <game.Icon />
                  ) : (
                    <PixelSprite
                      sprite={(game as { sprite: string }).sprite}
                      palette={PALETTES[(game as { palette: string }).palette] ?? PALETTES.blue}
                    />
                  )}
                </span>
                <span className="teaser-tile-tag">{game.tag}</span>
                <span className="teaser-tile-title">{game.title}</span>
                <span className="teaser-tile-desc">{game.description}</span>
                <span className="teaser-tile-cta">Play &rarr;</span>
              </a> : <TokenPlayButton gameId={`brain-${game.title.toLowerCase().replaceAll(" ", "-")}`} title={game.title} href={game.href} className="lab-link-row" key={game.href}>
                <span className="teaser-tile-icon" aria-hidden="true">
                  {game.Icon ? (
                    <game.Icon />
                  ) : (
                    <PixelSprite
                      sprite={(game as { sprite: string }).sprite}
                      palette={PALETTES[(game as { palette: string }).palette] ?? PALETTES.blue}
                    />
                  )}
                </span>
                <span className="teaser-tile-tag">{game.tag}</span>
                <span className="teaser-tile-title">{game.title}</span>
                <span className="teaser-tile-desc">{game.description}</span>
              </TokenPlayButton>)}
          </div>
        </div>
      </main>
    </>
  );
}
