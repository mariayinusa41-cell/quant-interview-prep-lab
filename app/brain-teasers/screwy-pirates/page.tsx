import type { Metadata } from "next";
import PirateMode from "./PirateMode";
import PirateStory from "./PirateStory";

export const metadata: Metadata = {
  title: "Screwy Pirates - Quant Interview Prep Lab",
  description: "The screwy pirates puzzle, playable.",
};

export default function ScrewyPiratesPage() {
  return (
    <>
      <PirateMode />
      <main className="pirate-stage-main">
        <a href="/brain-teasers" className="pirate-back-link">
          &larr; Brain Teasers
        </a>
        <PirateStory />
      </main>
    </>
  );
}
