import type { Metadata } from "next";
import CasinoMode from "../CasinoMode";
import DarkMode from "../../../DarkMode";
import BlackjackGame from "./BlackjackGame";

export const metadata: Metadata = {
  title: "Blackjack - Quitters Never Lose",
  description: "Hit, stand, double down. Dealer stands on all 17s.",
};

export default function BlackjackPage() {
  return (
    <>
      <DarkMode />
      <CasinoMode />
      <main className="pirate-stage-main answer-page">
        <a href="/probability/quitters-never-lose/casino" className="pirate-back-link">
          &larr; Casino
        </a>
        <BlackjackGame />
      </main>
    </>
  );
}
