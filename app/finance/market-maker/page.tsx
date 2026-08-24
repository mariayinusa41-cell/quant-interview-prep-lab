import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import MarketMakerGame from "./MarketMakerGame";

export const metadata: Metadata = {
  title: "Market Maker - Finance",
  description: "Quote a bid/ask spread, answer the EV question, and see who trades against you.",
};

export default function MarketMakerPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/finance" className="pirate-back-link">
          &larr; Finance
        </a>
        <MarketMakerGame />
      </main>
    </>
  );
}
