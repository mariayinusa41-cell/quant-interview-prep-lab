import type { Metadata } from "next";
import DarkMode from "../DarkMode";
import SurvivalDrill from "./SurvivalDrill";

export const metadata: Metadata = {
  title: "Dino Dash - Drill Lab",
  description: "An endless mental-math dino run: three lives, escalating speed and harder questions.",
};

export default function SurvivalDrillPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/drills" className="pirate-back-link">&larr; Drill Lab</a>
        <SurvivalDrill />
      </main>
    </>
  );
}