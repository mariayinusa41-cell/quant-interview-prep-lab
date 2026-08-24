import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import DuckIntersectionGame from "./DuckIntersectionGame";

export const metadata: Metadata = {
  title: "Crossroad Multitasker - Drill Lab",
  description: "A duck at a 4-way crossroad. Track whether it matches the road arrows and whether the live corner's math is even, as the question keeps switching.",
};

export default function DuckIntersectionPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/drills" className="pirate-back-link">
          &larr; Drill Lab
        </a>
        <DuckIntersectionGame />
      </main>
    </>
  );
}
