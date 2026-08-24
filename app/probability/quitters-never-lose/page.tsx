import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import { TicketIcon, CherrySlotIcon } from "./PixelIcons";

export const metadata: Metadata = {
  title: "Quitters Never Lose - Quant Interview Prep Lab",
  description: "A gambler simulation: pick a game and watch a real bankroll play out.",
};

export default function QuittersNeverLosePage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main">
        <a href="/probability" className="pirate-back-link">
          &larr; Probability
        </a>

        <div className="pirate-stage-content">
          <p className="pirate-kicker">Quitters Never Lose</p>
          <div className="category-picker category-picker-centered">
            <a href="/probability/quitters-never-lose/lottery" className="category-bubble">
              <span className="category-bubble-icon">
                <TicketIcon />
              </span>
              Lottery
            </a>
            <a href="/probability/quitters-never-lose/casino" className="category-bubble">
              <span className="category-bubble-icon">
                <CherrySlotIcon />
              </span>
              Casino
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
