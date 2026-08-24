import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import RuinWalkerGame from "../RuinWalkerGame";

export const metadata: Metadata = {
  title: "Ruin Walker - Stochastic Processes",
  description: "Play a Markov-chain random walk and learn the intuition behind Gambler's Ruin.",
};

export default function RuinWalkerPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/stochastic-processes" className="pirate-back-link">
          &larr; Stochastic Processes
        </a>
        <RuinWalkerGame />
      </main>
    </>
  );
}
