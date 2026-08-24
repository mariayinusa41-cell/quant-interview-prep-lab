import type { ReactNode } from "react";
import DarkMode from "../finance/DarkMode";
import "./calc.css";

type GamePageFrameProps = {
  kicker: string;
  title: string;
  children: ReactNode;
};

export default function GamePageFrame({ kicker, title, children }: GamePageFrameProps) {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/calculus-linear-algebra" className="pirate-back-link">&larr; Gradient Lab</a>
        <div className="answer-content">
          <p className="pirate-kicker">Calculus / Linear Algebra // {kicker}</p>
          <h1 className="pirate-story-line answer-title">{title}</h1>
          {children}
        </div>
      </main>
    </>
  );
}
