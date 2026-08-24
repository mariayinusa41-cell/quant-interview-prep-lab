import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import TokenPlayButton from "../access/TokenPlayButton";

export const metadata: Metadata = {
  title: "Calculus / Linear Algebra Lab",
  description: "Choose a focused game for Taylor approximations, constrained optimization, eigenvalues, PSD matrices, or Newton steps.",
};

export default function CalculusLinearAlgebraPage() {
  const games = [
    {
      number: "01",
      tag: "Taylor",
      title: "Taylor Slider",
      description: "Find the smallest expansion order that reaches the target error.",
      href: "/calculus-linear-algebra/taylor",
    },
    {
      number: "02",
      tag: "Lagrange",
      title: "Lagrange Optimizer",
      description: "Maximize a constrained objective by steering the slider to the optimum.",
      href: "/calculus-linear-algebra/lagrange",
    },
    {
      number: "03",
      tag: "Eigenvalues",
      title: "Eigenvector Spotter",
      description: "Identify the direction a matrix leaves invariant up to scale.",
      href: "/calculus-linear-algebra/eigenvalues",
    },
    {
      number: "04",
      tag: "PSD matrices",
      title: "PSD Classifier",
      description: "Classify symmetric matrices by the quadratic-form test.",
      href: "/calculus-linear-algebra/psd-matrices",
    },
    {
      number: "05",
      tag: "Root finding",
      title: "Newton Stepper",
      description: "Predict how many Newton iterations a fresh root problem needs.",
      href: "/calculus-linear-algebra/newton",
    },
  ];

  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main answer-page">
        <a href="/" className="pirate-back-link">&larr; Outcry</a>
        <div className="answer-content">
          <p className="pirate-kicker">Calculus / Linear Algebra // Game Select</p>
          <h1 className="pirate-story-line answer-title">Gradient Lab</h1>
          <p className="quiz-q-prompt" style={{ marginTop: 6, marginBottom: 16 }}>
            Five focused games. Pick one to start; every round still generates its function, matrix, or root fresh.
          </p>

          <div className="lab-link-list">
            {games.map((game) => (
              <TokenPlayButton gameId={`calculus-${game.title.toLowerCase().replaceAll(" ", "-")}`} title={game.title} href={game.href} className="lab-link-row" key={game.href}>
                <span className="teaser-tile-icon" aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "#f4c542" }}>
                  {game.number}
                </span>
                <span className="teaser-tile-tag">{game.tag}</span>
                <span className="teaser-tile-title">{game.title}</span>
                <span className="teaser-tile-desc">{game.description}</span>
              </TokenPlayButton>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
