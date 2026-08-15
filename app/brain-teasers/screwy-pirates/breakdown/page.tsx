import type { Metadata } from "next";
import PirateMode from "../PirateMode";
import BreakdownStory from "./BreakdownStory";

export const metadata: Metadata = {
  title: "Screwy Pirates - Full Breakdown",
  description: "An animated, step-by-step walkthrough of how the split is worked out, from 1 pirate up to 6.",
};

export default function BreakdownPage() {
  return (
    <>
      <PirateMode />
      <main className="pirate-stage-main">
        <a href="/brain-teasers/screwy-pirates/answer" className="pirate-back-link">
          &larr; Back to your answer
        </a>
        <BreakdownStory />
      </main>
    </>
  );
}
