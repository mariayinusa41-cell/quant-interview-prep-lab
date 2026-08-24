import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import ConcurrencyGame from "./ConcurrencyGame";

export const metadata: Metadata = {
  title: "Concurrency Clash - Quant Developer",
  description: "Data races, condition variables, memory ordering, and deadlock — read the code and find the defect.",
};

export default function ConcurrencyPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/quantdev" className="pirate-back-link">&larr; Quant Dev Lab</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Quant Developer // Game 02</p>
          <h1 className="pirate-story-line teasers-title">Concurrency Clash</h1>
          <p className="pirate-story-line teasers-subtitle">
            It compiles. It passed review. It fails on the wrong interleaving.
          </p>
          <ConcurrencyGame />
        </div>
      </main>
    </>
  );
}
