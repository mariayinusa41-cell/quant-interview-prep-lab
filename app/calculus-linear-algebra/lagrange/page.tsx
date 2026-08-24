import type { Metadata } from "next";
import LagrangeOptimizer from "../LagrangeOptimizer";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "Lagrange Optimizer - Calculus / Linear Algebra",
  description: "Play the constrained optimization game.",
};

export default function LagrangePage() {
  return <GamePageFrame kicker="Constrained optimization" title="Lagrange Optimizer"><LagrangeOptimizer /></GamePageFrame>;
}
