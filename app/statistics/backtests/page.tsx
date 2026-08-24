import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import BacktestGame from "./BacktestGame";

export const metadata: Metadata = {
  title: "Twenty Backtests - Statistics",
  description: "Twenty strategies, one gorgeous equity curve. Decide whether it's skill or selection bias.",
};

export default function BacktestsPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/statistics" className="pirate-back-link">
          &larr; Statistics
        </a>
        <BacktestGame />
      </main>
    </>
  );
}
