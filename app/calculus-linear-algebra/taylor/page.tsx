import type { Metadata } from "next";
import TaylorSlider from "../TaylorSlider";
import GamePageFrame from "../GamePageFrame";

export const metadata: Metadata = {
  title: "Taylor Slider - Calculus / Linear Algebra",
  description: "Play the Taylor approximation order game.",
};

export default function TaylorPage() {
  return <GamePageFrame kicker="Taylor approximations" title="Taylor Slider"><TaylorSlider /></GamePageFrame>;
}
