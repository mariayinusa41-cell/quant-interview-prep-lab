import type { Metadata } from "next";
import DarkMode from "../../DarkMode";
import TigerBreakdown from "./TigerBreakdown";

export const metadata: Metadata = {
  title: "Tiger and Sheep - Full Breakdown",
  description: "An animated, step-by-step walkthrough of why the sheep is only ever safe with an even number of tigers.",
};

export default function TigerBreakdownPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main">
        <a href="/brain-teasers/tiger-and-sheep/answer" className="pirate-back-link">
          &larr; Back to your answer
        </a>
        <TigerBreakdown />
      </main>
    </>
  );
}
