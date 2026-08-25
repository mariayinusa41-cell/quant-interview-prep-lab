import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import DevLogin from "./DevLogin";

export const metadata: Metadata = {
  title: "Developer access - Outcry",
  // Never index a credential prompt.
  robots: { index: false, follow: false },
};

export default function DevPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Outcry</a>
        <div className="answer-content">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line answer-title">Developer access</h1>
          <DevLogin />
        </div>
      </main>
    </>
  );
}
