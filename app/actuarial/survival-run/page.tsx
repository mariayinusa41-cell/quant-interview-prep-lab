import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import SurvivalRunGame from "./SurvivalRunGame";

export const metadata: Metadata = {
  title: "Survival Run - Actuarial",
  description: "Mortality tables, compounding survival, annuity EPV, and longevity risk.",
};

export default function SurvivalRunPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/actuarial" className="pirate-back-link">&larr; Actuarial Lab</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Actuarial // Game 02</p>
          <h1 className="pirate-story-line teasers-title">Survival Run</h1>
          <p className="pirate-story-line teasers-subtitle">
            Every year is a hurdle. How far the cohort gets is what you owe.
          </p>
          <SurvivalRunGame />
        </div>
      </main>
    </>
  );
}
