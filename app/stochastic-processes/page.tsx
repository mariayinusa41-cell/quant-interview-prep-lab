import type { Metadata } from "next";
import DarkMode from "../finance/DarkMode";
import PixelTileIcon from "../PixelTileIcon";

export const metadata: Metadata = {
  title: "Stochastic Processes - Outcry",
  description: "Gambler's ruin and martingale games - Markov chains, absorbing boundaries, and optional stopping.",
};

const subsections = [
  {
    href: "/stochastic-processes/ruin-walker",
    title: "Ruin Walker",
    tag: "Cramér-Lundberg",
    description: "Run an insurer's surplus against real compound-Poisson claims and compute the exact ruin probability ψ(u) = (1/(1+θ))·e^(−Ru) as it changes live.",
    tone: "blue" as const,
    icon: "target" as const,
  },
  {
    href: "/stochastic-processes/martingale-mutiny",
    title: "Martingale Mutiny",
    tag: "Optional stopping",
    description: "A flat edge against a proportional shock. Step for expected value or stop and bank it - then see what the one-step recursion says you should have done.",
    tone: "green" as const,
    icon: "walk" as const,
  },
];

export default function StochasticProcessesPage() {
  return (
    <>
      <DarkMode />
      <main className="pirate-stage-main teasers-page">
        <a href="/" className="pirate-back-link">
          &larr; Back to home
        </a>

        <div className="teasers-index">
          <p className="pirate-kicker">Outcry</p>
          <h1 className="pirate-story-line teasers-title">Stochastic Processes</h1>
          <p className="pirate-story-line teasers-subtitle">
            Random walks that end somewhere specific - absorbing boundaries, one-step recursions, and knowing when to
            stop.
          </p>

          <div className="lab-link-list">
            {subsections.map((s) => (
              <a href={s.href} className="lab-link-row" key={s.href}>
                <span className="teaser-tile-icon" aria-hidden="true" style={{ fontSize: "1.8rem" }}>
                  <PixelTileIcon kind={s.icon} tone={s.tone} />
                </span>
                <span className="teaser-tile-tag">{s.tag}</span>
                <span className="teaser-tile-title">{s.title}</span>
                <span className="teaser-tile-desc">{s.description}</span>
                <span className="teaser-tile-cta">Play &rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
