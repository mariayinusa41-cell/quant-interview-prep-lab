import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import DistributionsGame from "./DistributionsGame";

export const metadata: Metadata = {
  title: "Read the Shape - Statistics",
  description: "Identify the distribution from its shape, then prove it with the moments - ending on the CLT.",
};

export default function DistributionsPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/statistics" className="pirate-back-link">
          &larr; Statistics
        </a>
        <DistributionsGame />
      </main>
    </>
  );
}
