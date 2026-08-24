import type { Metadata } from "next";
import DarkMode from "../../finance/DarkMode";
import AntitrustGame from "./AntitrustGame";

export const metadata: Metadata = {
  title: "The Antitrust Simulator - Economic Consulting",
  description: "HHI, merger screening thresholds, and why market definition decides the case.",
};

export default function AntitrustPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/econ" className="pirate-back-link">&larr; Economic Consulting</a>
        <div className="teasers-index">
          <p className="pirate-kicker">Economic Consulting // Game 02</p>
          <h1 className="pirate-story-line teasers-title">The Antitrust Simulator</h1>
          <p className="pirate-story-line teasers-subtitle">
            The arithmetic is easy. Deciding what counts as the market is the job.
          </p>
          <AntitrustGame />
        </div>
      </main>
    </>
  );
}
