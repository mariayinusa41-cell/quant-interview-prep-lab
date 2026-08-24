import type { Metadata } from "next";
import MiniTask from "../MiniTask";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "Mini Task - Algorithms / Coding",
  description: "Pick a level, solve a real coding problem, and answer questions before and after.",
};

export default function MiniTaskPage() {
  return <GamePageFrame kicker="Rookie → Advanced" title="Mini Task"><MiniTask /></GamePageFrame>;
}
