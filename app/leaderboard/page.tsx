import type { Metadata } from "next";
import SiteFooter from "../SiteFooter";
import DarkMode from "../finance/DarkMode";
import Leaderboard from "./Leaderboard";
import GameBoards from "./GameBoards";

export const metadata: Metadata = {
  title: "Leaderboard - Outcry",
  description: "Overall standings and per-game leaderboards across every Outcry lab.",
};

// The leaderboard existed only as a hub tab, so /leaderboard 404'd — a URL
// people type and share, and the natural target when someone says "check
// the leaderboard". Nothing in the app linked to it, so this was a missing
// page rather than a broken link.
export default function LeaderboardPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">
          &larr; Outcry
        </a>
        <div className="answer-content">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line answer-title">Leaderboard</h1>
          <Leaderboard />
          <GameBoards />
        </div>
        <SiteFooter />
      </main>
    </>
  );
}
