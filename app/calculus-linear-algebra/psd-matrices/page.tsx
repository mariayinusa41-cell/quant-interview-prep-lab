import type { Metadata } from "next";
import PSDClassifier from "../PSDClassifier";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "PSD Classifier - Calculus / Linear Algebra",
  description: "Play the positive semidefinite matrix classification game.",
};

export default function PSDMatricesPage() {
  return <GamePageFrame kicker="Covariance validity" title="PSD Classifier"><PSDClassifier /></GamePageFrame>;
}
