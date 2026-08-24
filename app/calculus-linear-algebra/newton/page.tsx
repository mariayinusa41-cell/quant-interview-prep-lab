import type { Metadata } from "next";
import NewtonStepper from "../NewtonStepper";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "Newton Stepper - Calculus / Linear Algebra",
  description: "Play the Newton root-finding iteration game.",
};

export default function NewtonPage() {
  return <GamePageFrame kicker="Root finding" title="Newton Stepper"><NewtonStepper /></GamePageFrame>;
}
