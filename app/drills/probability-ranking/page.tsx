import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import ProbabilityRankingGame from "./ProbabilityRankingGame";

export const metadata: Metadata = {
  title: "Likelihood Ranking - Drill Lab",
  description: "Order students, distributions, and dice/card/urn events from most likely to least likely.",
};

export default function ProbabilityRankingPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/drills" className="pirate-back-link">
          &larr; Drill Lab
        </a>
        <ProbabilityRankingGame />
      </main>
    </>
  );
}
