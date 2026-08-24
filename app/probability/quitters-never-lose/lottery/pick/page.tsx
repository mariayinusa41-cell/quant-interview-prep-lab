import type { Metadata } from "next";
import DarkMode from "../../../DarkMode";
import TokenPlayButton from "../../../../access/TokenPlayButton";

export const metadata: Metadata = {
  title: "Pick 3/4/5 - Quitters Never Lose",
  description: "Choose 3, 4, or 5 digits.",
};

export default function PickChoosePage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main">
        <a href="/probability/quitters-never-lose/lottery" className="pirate-back-link">
          &larr; Lottery
        </a>

        <div className="pirate-stage-content">
          <p className="pirate-kicker">Pick a game</p>
          <div className="category-picker category-picker-centered">
            <TokenPlayButton gameId="probability-pick-3" title="Pick 3" href="/probability/quitters-never-lose/lottery/pick/play?n=3" className="category-bubble">
              <span className="category-bubble-icon">3</span>
              Pick 3
            </TokenPlayButton>
            <TokenPlayButton gameId="probability-pick-4" title="Pick 4" href="/probability/quitters-never-lose/lottery/pick/play?n=4" className="category-bubble">
              <span className="category-bubble-icon">4</span>
              Pick 4
            </TokenPlayButton>
            <TokenPlayButton gameId="probability-pick-5" title="Pick 5" href="/probability/quitters-never-lose/lottery/pick/play?n=5" className="category-bubble">
              <span className="category-bubble-icon">5</span>
              Pick 5
            </TokenPlayButton>
          </div>
        </div>
      </main>
    </>
  );
}
