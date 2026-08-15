import type { Metadata } from "next";
import DarkMode from "../../DarkMode";
import TigerAnswerBuilder from "./TigerAnswerBuilder";

export const metadata: Metadata = {
  title: "Tiger and Sheep - Work Out the Rule",
  description: "Predict whether the sheep gets eaten, for any number of tigers.",
};

export default function TigerAnswerPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/brain-teasers/tiger-and-sheep" className="pirate-back-link">
          &larr; Back to the puzzle
        </a>
        <TigerAnswerBuilder />
      </main>
    </>
  );
}
