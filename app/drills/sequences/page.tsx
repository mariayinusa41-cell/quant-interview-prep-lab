import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import SequenceGame from "./SequenceGame";

export const metadata: Metadata = {
  title: "Sequence Sprint - Drill Lab",
  description: "Guess the next number in procedurally generated interview-style sequences.",
};

export default function SequencePage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/drills" className="pirate-back-link">
          &larr; Drill Lab
        </a>
        <SequenceGame />
      </main>
    </>
  );
}
