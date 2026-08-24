import type { Metadata } from "next";
import SpeedRound from "../SpeedRound";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "Speed Round - Algorithms / Coding",
  description: "Play the timed algorithms and complexity question game.",
};

export default function SpeedRoundPage() {
  return <GamePageFrame kicker="Complexity" title="Speed Round"><SpeedRound /></GamePageFrame>;
}
