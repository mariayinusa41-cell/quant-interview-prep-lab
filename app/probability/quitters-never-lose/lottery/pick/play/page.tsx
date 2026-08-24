import type { Metadata } from "next";
import { Suspense } from "react";
import DarkMode from "../../../../DarkMode";
import PickGame from "../PickGame";

export const metadata: Metadata = {
  title: "Pick 3/4/5 - Quitters Never Lose",
  description: "Fill in a ticket, answer the odds, watch the draw.",
};

export default function PickPlayPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/probability/quitters-never-lose/lottery/pick" className="pirate-back-link">
          &larr; Choose game
        </a>
        <Suspense fallback={null}>
          <PickGame />
        </Suspense>
      </main>
    </>
  );
}
