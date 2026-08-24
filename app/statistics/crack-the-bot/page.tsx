import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import CrackTheBotGame from "./CrackTheBotGame";

export const metadata: Metadata = {
  title: "Crack the Bot - Statistics",
  description: "Reverse-engineer a rival algorithm's trading rule from the tape, against the clock.",
};

export default function CrackTheBotPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/statistics" className="pirate-back-link">
          &larr; Statistics
        </a>
        <CrackTheBotGame />
      </main>
    </>
  );
}
