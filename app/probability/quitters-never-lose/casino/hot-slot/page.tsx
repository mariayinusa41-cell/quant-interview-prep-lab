import type { Metadata } from "next";
import CasinoMode from "../CasinoMode";
import DarkMode from "../../../DarkMode";
import HotSlotGame from "./HotSlotGame";

export const metadata: Metadata = {
  title: "Russian Roulette - Quitters Never Lose",
  description: "Pick a number, answer the odds, and decide when to cash out as the wheel shrinks.",
};

export default function HotSlotPage() {
  return (
    <>
      <DarkMode />
      <CasinoMode />
      <main className="pirate-stage-main answer-page">
        <a href="/probability/quitters-never-lose/casino" className="pirate-back-link">
          &larr; Casino
        </a>
        <HotSlotGame />
      </main>
    </>
  );
}
