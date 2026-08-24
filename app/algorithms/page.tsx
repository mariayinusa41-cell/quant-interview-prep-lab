import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import TokenPlayButton from "../access/TokenPlayButton";

export const metadata: Metadata = {
  title: "Algorithms / Coding Lab",
  description: "Choose a focused game for dynamic programming, Monte Carlo, complexity, or leveled coding challenges.",
};

export default function AlgorithmsPage() {
  const games = [
    {
      number: "01",
      tag: "Dynamic programming",
      title: "DP Table Builder",
      description: "Fill a memo table by hand and build the recurrence one cell at a time.",
      href: "/algorithms/dp-table-builder",
    },
    {
      number: "02",
      tag: "Monte Carlo",
      title: "Monte Carlo Estimator",
      description: "Run a simulation, read the estimate, and reason about sampling error.",
      href: "/algorithms/monte-carlo",
    },
    {
      number: "03",
      tag: "Complexity",
      title: "Speed Round",
      description: "Answer shuffled algorithm and complexity questions against the clock.",
      href: "/algorithms/speed-round",
    },
    {
      number: "04",
      tag: "Rookie → Advanced",
      title: "Mini Task",
      description: "Pick a level, solve a real coding problem by typing actual code, and answer questions before and after.",
      href: "/algorithms/mini-task",
    },
  ];

  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Quant Interview Prep Lab</a>
        <div className="answer-content">
          <p className="pirate-kicker">Algorithms / Coding // Game Select</p>
          <h1 className="pirate-story-line answer-title">Algorithm Arena</h1>
          <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
            Four focused games for complexity, dynamic programming, Monte Carlo, and leveled coding challenges you solve by typing real code.
          </p>

          <div className="lab-link-list">
            {games.map((game) =>
              game.title === "Mini Task" ? <a href={game.href} className="lab-link-row" key={game.href}>
                <span className="teaser-tile-icon" aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#f4c542" }}>
                  {game.number}
                </span>
                <span className="teaser-tile-tag">{game.tag}</span>
                <span className="teaser-tile-title">{game.title}</span>
                <span className="teaser-tile-desc">{game.description}</span>
                <span className="teaser-tile-cta">Play &rarr;</span>
              </a> : <TokenPlayButton gameId={`algorithms-${game.title.toLowerCase().replaceAll(" ", "-")}`} title={game.title} href={game.href} className="lab-link-row" key={game.href}>
                <span className="teaser-tile-icon" aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#f4c542" }}>
                  {game.number}
                </span>
                <span className="teaser-tile-tag">{game.tag}</span>
                <span className="teaser-tile-title">{game.title}</span>
                <span className="teaser-tile-desc">{game.description}</span>
              </TokenPlayButton>)}
          </div>
        </div>
      </main>
    </>
  );
}
