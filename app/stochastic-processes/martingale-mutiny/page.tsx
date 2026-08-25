import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import MartingaleMutinyGame from "./MartingaleMutinyGame";

export const metadata: Metadata = {
  title: "Martingale Mutiny - Stochastic Processes",
  description: "A flat edge against a proportional shock - step for expected value or stop and bank it, and see how the optional-stopping recursion scores your call.",
};

export default function MartingaleMutinyPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/stochastic-processes" className="pirate-back-link">
          &larr; Stochastic Processes
        </a>
        <MartingaleMutinyGame />
      </main>
    </>
  );
}
