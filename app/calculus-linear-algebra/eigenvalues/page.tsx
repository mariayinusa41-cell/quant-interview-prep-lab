import type { Metadata } from "next";
import EigenvectorSpotter from "../EigenvectorSpotter";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "Eigenvector Spotter - Calculus / Linear Algebra",
  description: "Play the eigenvector identification game.",
};

export default function EigenvaluesPage() {
  return <GamePageFrame kicker="Invariant directions" title="Eigenvector Spotter"><EigenvectorSpotter /></GamePageFrame>;
}
