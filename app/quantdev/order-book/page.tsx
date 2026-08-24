import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import OrderBookGame from "./OrderBookGame";

export const metadata: Metadata = {
  title: "The Order Book Engine - Quant Developer",
  description: "Build a matching engine with price-time priority and an O(1) cancel.",
};

export default function OrderBookPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/quantdev" className="pirate-back-link">&larr; Quant Dev Lab</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Quant Developer // Game 01</p>
          <h1 className="pirate-story-line teasers-title">The Order Book Engine</h1>
          <p className="pirate-story-line teasers-subtitle">
            Most orders never trade. They get cancelled — and that is the hot path.
          </p>
          <OrderBookGame />
        </div>
      </main>
    </>
  );
}
