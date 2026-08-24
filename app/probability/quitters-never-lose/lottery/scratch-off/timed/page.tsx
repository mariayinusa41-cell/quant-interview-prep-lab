import type { Metadata } from "next";
import DarkMode from "../../../../DarkMode";
import QuestionCountPicker from "../QuestionCountPicker";

export const metadata: Metadata = {
  title: "Timed - Quitters Never Lose",
  description: "7 or 13 questions per ticket, against the clock.",
};

export default function TimedPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main">
        <a href="/probability/quitters-never-lose/lottery/scratch-off" className="pirate-back-link">
          &larr; Scratch-Off
        </a>

        <div className="pirate-stage-content">
          <p className="pirate-kicker">Scratch-Off / Timed</p>
          <QuestionCountPicker timed />
        </div>
      </main>
    </>
  );
}
