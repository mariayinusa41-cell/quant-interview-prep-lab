import type { Metadata } from "next";
import DarkMode from "../../../DarkMode";
import { ClockIcon, PencilIcon } from "../../PixelIcons";

export const metadata: Metadata = {
  title: "Scratch-Off - Quitters Never Lose",
  description: "Timed or not timed.",
};

export default function ScratchOffSetupPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main">
        <a href="/probability/quitters-never-lose/lottery" className="pirate-back-link">
          &larr; Lottery
        </a>

        <div className="pirate-stage-content">
          <p className="pirate-kicker">Scratch-Off</p>
          <div className="category-picker category-picker-centered">
            <a href="/probability/quitters-never-lose/lottery/scratch-off/timed" className="category-bubble">
              <span className="category-bubble-icon">
                <ClockIcon />
              </span>
              Timed
            </a>
            <a href="/probability/quitters-never-lose/lottery/scratch-off/not-timed" className="category-bubble">
              <span className="category-bubble-icon">
                <PencilIcon />
              </span>
              Not Timed
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
