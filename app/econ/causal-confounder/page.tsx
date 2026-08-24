import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import CausalConfounderGame from "./CausalConfounderGame";

export const metadata: Metadata = {
  title: "The Causal Confounder - Economic Consulting",
  description: "Difference-in-differences, parallel trends, and isolating causation from a market-wide trend.",
};

export default function CausalConfounderPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/econ" className="pirate-back-link">&larr; Economic Consulting</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Economic Consulting // Game 01</p>
          <h1 className="pirate-story-line teasers-title">The Causal Confounder</h1>
          <p className="pirate-story-line teasers-subtitle">
            Sales fell. Proving what caused it is the whole job.
          </p>
          <CausalConfounderGame />
        </div>
      </main>
    </>
  );
}
