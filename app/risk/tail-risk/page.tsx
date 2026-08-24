import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import TailRiskGame from "./TailRiskGame";

export const metadata: Metadata = {
  title: "Tail Risk Stress Tester - Risk",
  description: "VaR, Expected Shortfall, correlation breakdown, and why normal tails lie.",
};

export default function TailRiskPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/risk" className="pirate-back-link">&larr; Risk Lab</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Risk // Game 01</p>
          <h1 className="pirate-story-line teasers-title">Tail Risk Stress Tester</h1>
          <p className="pirate-story-line teasers-subtitle">
            The model was fit on a calm market. Then the market stopped being calm.
          </p>
          <TailRiskGame />
        </div>
      </main>
    </>
  );
}
