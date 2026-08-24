import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import DeltaDefenderGame from "./DeltaDefenderGame";

export const metadata: Metadata = {
  title: "Delta Defender - Finance",
  description: "Hedge a short call in real time against real Black-Scholes Greeks and geometric Brownian motion.",
};

export default function DeltaDefenderPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/finance" className="pirate-back-link">
          &larr; Finance Lab
        </a>
        <DeltaDefenderGame />
      </main>
    </>
  );
}
