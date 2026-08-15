import type { Metadata } from "next";
import PirateMode from "../PirateMode";
import AnswerBuilder from "./AnswerBuilder";

export const metadata: Metadata = {
  title: "Screwy Pirates - Work Out the Split",
  description: "Fill in how the gold should be divided, for any crew size from 1 to 6.",
};

export default function ScrewyPiratesAnswerPage() {
  return (
    <>
      <PirateMode />
      <main className="pirate-stage-main answer-page">
        <a href="/brain-teasers/screwy-pirates" className="pirate-back-link">
          &larr; Back to the puzzle
        </a>
        <AnswerBuilder />
      </main>
    </>
  );
}
