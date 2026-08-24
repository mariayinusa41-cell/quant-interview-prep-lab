import type { Metadata } from "next";
import CasinoMode from "./CasinoMode";
import DarkMode from "../../DarkMode";
import { BlackjackIcon, RouletteIcon, DiceIcon } from "../PixelIcons";
import TokenPlayButton from "../../../access/TokenPlayButton";

export const metadata: Metadata = {
  title: "Casino - Quitters Never Lose",
  description: "Casino games.",
};

const casinoGames = [
  { title: "Poker", description: "Heads-up, hand after hand.", href: null },
  {
    title: "Blackjack",
    description: "Hit, stand, and the dealer's edge.",
    href: "/probability/quitters-never-lose/casino/blackjack",
    icon: "blackjack" as const,
  },
  {
    title: "Russian Roulette",
    description: "Pick a number, answer the odds, and decide when to cash out as the wheel shrinks.",
    href: "/probability/quitters-never-lose/casino/hot-slot",
    icon: "roulette" as const,
  },
  {
    title: "Dice EV Lab",
    description: "Reroll games, roll-until-target, max/min of N, bust accumulators, and backgammon-flavored EV — endless dice questions.",
    href: "/probability/quitters-never-lose/casino/dice-lab",
    icon: "dice" as const,
  },
];

export default function CasinoPage() {
  return (
    <>
      <DarkMode />
      <CasinoMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/probability/quitters-never-lose" className="pirate-back-link">
          &larr; Quitters Never Lose
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Quitters Never Lose</p>
          <h1 className="pirate-story-line teasers-title">Casino</h1>

          <div className="game-tile-grid">
            {casinoGames.map((g) =>
              g.href ? (
                <TokenPlayButton gameId={`probability-casino-${g.title.toLowerCase().replaceAll(" ", "-")}`} title={g.title} href={g.href} className="game-tile" key={g.title}>
                  {g.icon === "blackjack" && <BlackjackIcon className="game-tile-icon" />}
                  {g.icon === "roulette" && <RouletteIcon className="game-tile-icon" />}
                  {g.icon === "dice" && <DiceIcon className="game-tile-icon" />}
                  <span className="game-tile-title">{g.title}</span>
                  <span className="game-tile-desc">{g.description}</span>
                </TokenPlayButton>
              ) : (
                <div className="game-tile is-disabled" key={g.title}>
                  <span className="game-tile-title">{g.title}</span>
                  <span className="game-tile-desc">{g.description}</span>
                  <span className="game-tile-cta">Coming soon</span>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </>
  );
}
