import type { Metadata } from "next";
import DarkMode from "../../DarkMode";
import { ScratchIcon, BallIcon } from "../PixelIcons";

export const metadata: Metadata = {
  title: "Lottery - Quitters Never Lose",
  description: "Pick a lottery game.",
};

export default function LotteryPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/probability/quitters-never-lose" className="pirate-back-link">
          &larr; Quitters Never Lose
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Lottery</p>
          <h1 className="pirate-story-line teasers-title">Pick a game</h1>

          <div className="game-tile-grid">
            <a href="/probability/quitters-never-lose/lottery/scratch-off" className="game-tile">
              <ScratchIcon className="game-tile-icon" />
              <span className="game-tile-title">Scratch-Off</span>
              <span className="game-tile-desc">Buy a ticket, answer the odds, decide whether to scratch.</span>
              <span className="game-tile-cta">Play</span>
            </a>
            <a href="/probability/quitters-never-lose/lottery/pick" className="game-tile">
              <BallIcon className="game-tile-icon" />
              <span className="game-tile-title">Pick 3/4/5</span>
              <span className="game-tile-desc">Fill in a ticket, answer the odds, watch the draw.</span>
              <span className="game-tile-cta">Play</span>
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
