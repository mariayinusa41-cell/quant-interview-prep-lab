import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import TigerStory from "./TigerStory";

export const metadata: Metadata = {
  title: "Tiger and Sheep - Quant Interview Prep Lab",
  description: "A hundred tigers, one sheep, and a question of parity.",
};

export default function TigerAndSheepPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main">
        <a href="/brain-teasers" className="pirate-back-link">
          &larr; Brain Teasers
        </a>
        <TigerStory />
      </main>
    </>
  );
}
