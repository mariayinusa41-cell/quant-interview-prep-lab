import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import ArithmeticDrillGame from "./ArithmeticDrillGame";

export const metadata: Metadata = {
  title: "Arithmetic Drill - Drill Lab",
  description: "2.5 minutes of mental math. Play solo or race a ghost of a real past run.",
};

export default function ArithmeticDrillPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/drills" className="pirate-back-link">
          &larr; Drill Lab
        </a>
        <ArithmeticDrillGame />
      </main>
    </>
  );
}
