import type { Metadata } from "next";
import DPBuilder from "../DPBuilder";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "DP Table Builder - Algorithms / Coding",
  description: "Play the dynamic programming memo table game.",
};

export default function DPTableBuilderPage() {
  return <GamePageFrame kicker="Dynamic programming" title="DP Table Builder"><DPBuilder /></GamePageFrame>;
}
