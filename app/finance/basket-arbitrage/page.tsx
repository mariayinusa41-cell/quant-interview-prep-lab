import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import BasketArbitrageGame from "./BasketArbitrageGame";

export const metadata: Metadata = {
  title: "Basket Arbitrage - Finance",
  description: "Balance a multi-leg commodity basket's inventory to zero and lock in the bid/ask spread.",
};

export default function BasketArbitragePage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/finance" className="pirate-back-link">
          &larr; Finance
        </a>
        <BasketArbitrageGame />
      </main>
    </>
  );
}
