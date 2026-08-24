import type { Metadata } from "next";
import { Suspense } from "react";
import DarkMode from "../../../../DarkMode";
import ScratchOffGame from "./ScratchOffGame";

export const metadata: Metadata = {
  title: "Scratch-Off - Quitters Never Lose",
  description: "Buy scratch-off tickets and watch your bankroll play out.",
};

export default function ScratchOffPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/probability/quitters-never-lose/lottery/scratch-off" className="pirate-back-link">
          &larr; Scratch-Off Setup
        </a>
        <Suspense fallback={null}>
          <ScratchOffGame />
        </Suspense>
      </main>
    </>
  );
}
