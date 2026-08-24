import type { Metadata } from "next";
import MonteCarloEstimator from "../MonteCarloEstimator";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "Monte Carlo Estimator - Algorithms / Coding",
  description: "Play the Monte Carlo simulation and estimation game.",
};

export default function MonteCarloPage() {
  return <GamePageFrame kicker="Monte Carlo" title="Monte Carlo Estimator"><MonteCarloEstimator /></GamePageFrame>;
}
