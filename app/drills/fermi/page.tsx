import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import FermiGame from "./FermiGame";

export const metadata: Metadata = {
  title: "Fermi Estimation - Drill Lab",
  description: "Estimate real-world quantities to the right order of magnitude — a core quant interview skill.",
};

export default function FermiPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/drills" className="pirate-back-link">
          &larr; Drill Lab
        </a>
        <FermiGame />
      </main>
    </>
  );
}
