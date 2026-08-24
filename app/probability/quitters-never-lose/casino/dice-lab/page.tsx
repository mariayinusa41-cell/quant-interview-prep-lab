import type { Metadata } from "next";
import CasinoMode from "../CasinoMode";
import DarkMode from "../../../DarkMode";
import DiceEVGame from "./DiceEVGame";

export const metadata: Metadata = {
  title: "Dice EV Lab - Quitters Never Lose",
  description: "Reroll games, roll-until-target, max/min of N, bust accumulators, and backgammon-flavored dice EV questions.",
};

export default function DiceLabPage() {
  return (
    <>
      <DarkMode />
      <CasinoMode />
      <main className="pirate-stage-main answer-page">
        <a href="/probability/quitters-never-lose/casino" className="pirate-back-link">
          &larr; Casino
        </a>
        <DiceEVGame />
      </main>
    </>
  );
}
