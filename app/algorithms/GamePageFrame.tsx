import type { ReactNode } from "react";
import DarkMode from "../finance/DarkMode";
import "./algo.css";

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
        <a href="/algorithms" className="pirate-back-link">&larr; Algorithm Arena</a>
        <div className="answer-content">
          <p className="pirate-kicker">Algorithms / Coding // {kicker}</p>
          <h1 className="pirate-story-line answer-title">{title}</h1>
          {children}
        </div>
      </main>
    </>
  );
}
