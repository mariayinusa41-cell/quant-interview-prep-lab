import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import LossTriangleGame from "./LossTriangleGame";

export const metadata: Metadata = {
  title: "Loss Triangle Labyrinth - Actuarial",
  description: "Chain ladder link ratios, IBNR reserves, and when to switch to Bornhuetter-Ferguson.",
};

export default function LossTrianglePage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/actuarial" className="pirate-back-link">&larr; Actuarial Lab</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Actuarial // Game 01</p>
          <h1 className="pirate-story-line teasers-title">Loss Triangle Labyrinth</h1>
          <p className="pirate-story-line teasers-subtitle">
            Reserve for claims that already happened but have not been paid.
          </p>
          <LossTriangleGame />
        </div>
      </main>
    </>
  );
}
